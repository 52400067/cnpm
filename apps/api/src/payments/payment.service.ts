import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";

import {
  OrderStatus,
  TransactionStatus,
  PaymentProvider,
} from "@tickethub/shared";

import { db } from "../database/db";
import { orders, transactions } from "../database/schema";
import { VnpayGateway } from "./vnpay.gateway";
import { env } from "../config/env.config";

@Injectable()
export class PaymentService {
  async createVnpayPayment(userId: string, orderId: string, clientIp: string) {
    return db.transaction(async (tx) => {
      // 1. Khóa đơn hàng để tránh hai request
      // đồng thời tạo hai giao dịch.
      const [order] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)
        .for("update");

      if (!order) {
        throw new NotFoundException("Order not found");
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException("Order is not pending");
      }

      const now = new Date();

      // Yêu cầu còn tối thiểu 2 phút giữ vé.
      if (order.expiresAt.getTime() - now.getTime() < 2 * 60 * 1000) {
        throw new ConflictException(
          "Order hold is expired or too close to expiry",
        );
      }

      // 2. Không tạo hai giao dịch VNPay cho cùng
      // một đơn trong phiên bản an toàn ban đầu.
      const [existingTransaction] = await tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.orderId, order.id),
            eq(transactions.provider, PaymentProvider.VNPAY),
          ),
        )
        .limit(1);

      if (existingTransaction) {
        throw new ConflictException(
          "VNPay payment already initiated for this order",
        );
      }

      // 3. Số tiền lấy từ PostgreSQL, không lấy
      // từ request Frontend.
      // TicketHub đang dùng VNĐ nguyên.
      const match = /^([1-9]\d*)\.00$/.exec(order.finalAmount);

      const integerPart = match?.[1];

      if (!integerPart) {
        throw new BadRequestException("Invalid order amount");
      }

      const amountVnd = Number(integerPart);

      if (!Number.isSafeInteger(amountVnd)) {
        throw new BadRequestException(
          "Order amount exceeds safe integer range",
        );
      }

      // 4. Mã giao dịch ngẫu nhiên, không chứa
      // dấu gạch ngang hoặc ký tự đặc biệt.
      const transactionRef =
        "BE2" + randomBytes(12).toString("hex").toUpperCase();

      const gateway = new VnpayGateway();

      // 5. Hạn thanh toán không vượt quá
      // thời gian giữ vé của Booking.
      const payment = await gateway.createPaymentUrl({
        transactionRef,
        amountVnd,
        orderInfo: `TicketHub order ${order.orderCode}`,
        returnUrl: env.VNPAY_RETURN_URL,
        ipAddress: clientIp,
        expiresAt: order.expiresAt,
      });

      // 6. Lưu giao dịch trước khi trả URL
      // về cho Frontend.
      await tx.insert(transactions).values({
        orderId: order.id,
        provider: PaymentProvider.VNPAY,
        transactionRef,
        amount: order.finalAmount,
        status: TransactionStatus.PENDING,
        idempotencyKey: `vnpay:${order.id}`,
      });

      return {
        orderId: order.id,
        orderCode: order.orderCode,
        transactionRef: payment.transactionRef,
        paymentUrl: payment.paymentUrl,
        amountVnd,
        expiresAt: order.expiresAt.toISOString(),
      };
    });
  }
}
