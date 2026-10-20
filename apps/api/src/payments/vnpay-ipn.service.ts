import { Injectable } from "@nestjs/common";
import { and, eq, gte, sql } from "drizzle-orm";

import {
  OrderStatus,
  TransactionStatus,
  PaymentProvider,
  OutboxStatus,
} from "@tickethub/shared";

import { db } from "../database/db";
import {
  orders,
  transactions,
  orderItems,
  ticketTypes,
  outbox,
} from "../database/schema";

import { VnpayGateway } from "./vnpay.gateway";
import { toVnpayAmount } from "./vnpay-ipn.preview.service";
import { decideVnpayIpn, type IpnDecision } from "./vnpay-ipn.decision";

@Injectable()
export class VnpayIpnService {
  private readonly gateway = new VnpayGateway();

  async process(params: Record<string, string>): Promise<IpnDecision> {
    // 1. Xac minh chu ky va merchant VNPay
    const verified = this.gateway.verifyCallback(params);

    if (!verified.verified || !verified.transactionRef) {
      return "INVALID_SIGNATURE";
    }

    // 2. Tim giao dich do Backend da tao
    const existing = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.transactionRef, verified.transactionRef),
        eq(transactions.provider, PaymentProvider.VNPAY),
      ),
    });

    if (!existing) {
      return "ORDER_NOT_FOUND";
    }
    const finalSuccess =
      params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    const finalFailure =
      params.vnp_ResponseCode !== "00" &&
      params.vnp_ResponseCode !== "07" &&
      params.vnp_TransactionStatus === "02";
    if (!finalSuccess && !finalFailure) {
      return "MANUAL_REVIEW";
    }
    // 3. Tat ca thay doi phai nam trong mot DB transaction
    return db.transaction(async (tx): Promise<IpnDecision> => {
      // Khoa order truoc, tuong thich voi Booking Cleanup
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, existing.orderId))
        .for("update");

      if (!order) {
        return "ORDER_NOT_FOUND";
      }

      // Khoa transaction de ngan callback xu ly trung
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, existing.id))
        .for("update");

      if (!transaction || transaction.orderId !== order.id) {
        return "MANUAL_REVIEW";
      }

      // 4. So sanh so tien tu VNPay, transaction, order
      const callbackAmount = params.vnp_Amount;
      const transactionAmount = toVnpayAmount(transaction.amount);
      const orderAmount = toVnpayAmount(order.finalAmount);

      const amountMatches =
        transactionAmount !== null &&
        orderAmount !== null &&
        callbackAmount === transactionAmount &&
        callbackAmount === orderAmount;

      // Callback that bai da ghi nhan truoc do
      if (
        amountMatches &&
        transaction.status === TransactionStatus.FAILED &&
        order.status === OrderStatus.FAILED &&
        !verified.success
      ) {
        return "ALREADY_PROCESSED";
      }

      const now = new Date();

      const decision = decideVnpayIpn({
        signatureValid: true,
        transactionFound: true,
        amountMatches,
        orderStatus: order.status,
        transactionStatus: transaction.status,
        paymentSuccessful: verified.success,
        orderExpired: now >= order.expiresAt,
      });

      // Khong sua DB voi callback bat thuong
      if (decision !== "APPLY_SUCCESS" && decision !== "RECORD_FAILURE") {
        return decision;
      }

      // 5. Doc cac ve thuoc don hang
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      if (items.length === 0) {
        return "MANUAL_REVIEW";
      }

      // Phien ban dau chi xu ly ve dung GA.
      // Ve ghe ngoi can xu ly SeatStatus rieng.
      if (items.some((item) => item.seatId !== null || item.quantity <= 0)) {
        return "MANUAL_REVIEW";
      }

      // 6. Cap nhat ton kho GA, co dieu kien chong am so ve
      for (const item of items) {
        const updated = await tx
          .update(ticketTypes)
          .set({
            heldCount: sql`${ticketTypes.heldCount} - ${item.quantity}`,
            ...(decision === "APPLY_SUCCESS"
              ? {
                  soldCount: sql`${ticketTypes.soldCount} + ${item.quantity}`,
                }
              : {}),
            updatedAt: now,
          })
          .where(
            and(
              eq(ticketTypes.id, item.ticketTypeId),
              eq(ticketTypes.eventId, order.eventId),
              eq(ticketTypes.isSeated, false),
              gte(ticketTypes.heldCount, item.quantity),
            ),
          )
          .returning({ id: ticketTypes.id });

        // Rollback toan bo neu du lieu kho ve bat nhat
        if (updated.length !== 1) {
          throw new Error(
            "VNPAY_INVENTORY_CONFLICT: manual reconciliation required",
          );
        }
      }

      // 7. Cap nhat giao dich
      await tx
        .update(transactions)
        .set({
          status:
            decision === "APPLY_SUCCESS"
              ? TransactionStatus.SUCCESS
              : TransactionStatus.FAILED,
          responseCode: params.vnp_ResponseCode ?? null,
          providerTxNumber: verified.providerTransactionId ?? null,
          bankCode: params.vnp_BankCode ?? null,
          rawCallback: params,
          updatedAt: now,
        })
        .where(eq(transactions.id, transaction.id));

      // 8. Cap nhat order trong cung transaction
      await tx
        .update(orders)
        .set({
          status:
            decision === "APPLY_SUCCESS"
              ? OrderStatus.PAID
              : OrderStatus.FAILED,
          paidAt: decision === "APPLY_SUCCESS" ? now : null,
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      // Ghi su kien ORDER_PAID trong cung DB transaction.
      // Callback lap lai khong duoc tao them su kien.
      if (decision === "APPLY_SUCCESS") {
        await tx.insert(outbox).values({
          eventType: "ORDER_PAID",
          status: OutboxStatus.PENDING,
          payload: {
            orderId: order.id,
            orderCode: order.orderCode,
            userId: order.userId,
            eventId: order.eventId,
            transactionId: transaction.id,
            transactionRef: transaction.transactionRef,
            provider: PaymentProvider.VNPAY,
            amount: order.finalAmount,
            paidAt: now.toISOString(),
          },
        });
      }
      return decision;

      return decision;
    });
  }
}
