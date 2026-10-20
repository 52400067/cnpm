import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PaymentProvider } from "@tickethub/shared";

import { db } from "../database/db";
import { orders, transactions } from "../database/schema";

import { decideVnpayIpn, type IpnDecision } from "./vnpay-ipn.decision";

// Chuyển số tiền VNĐ trong PostgreSQL
// thành đơn vị vnp_Amount (nhân 100).
// Không dùng Number để tránh sai số tiền.

export function toVnpayAmount(amount: string): string | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(amount);

  if (!match) return null;

  const integerPart = match[1];

  // Đảm bảo giá trị luôn là string trước khi đưa vào BigInt.
  if (integerPart === undefined) return null;

  const fraction = (match[2] ?? "").padEnd(2, "0");

  // TicketHub chỉ chấp nhận số tiền VNĐ nguyên.
  if (fraction !== "00") return null;

  const vnd = BigInt(integerPart);

  if (vnd <= 0n) return null;

  return (vnd * 100n).toString();
}

@Injectable()
export class VnpayIpnPreviewService {

  async inspect(params: Record<string, string>): Promise<IpnDecision> {
    // 1. Xác minh chữ ký VNPay trước khi truy vấn DB.
    const { VnpayGateway } = await import("./vnpay.gateway");
    const verified = new VnpayGateway().verifyCallback(params);

    if (!verified.verified || !verified.transactionRef) {
      return "INVALID_SIGNATURE";
    }

    // 2. Tra cứu giao dịch đã tạo trong TicketHub.
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionRef, verified.transactionRef))
      .limit(1);

    if (!transaction) {
      return "ORDER_NOT_FOUND";
    }

    if (transaction.provider !== PaymentProvider.VNPAY) {
      return "MANUAL_REVIEW";
    }

    // 3. Tra cứu đơn hàng tương ứng.
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, transaction.orderId))
      .limit(1);

    if (!order) {
      return "MANUAL_REVIEW";
    }

    // 4. Đối chiếu số tiền từ cả 3 nguồn.
    const callbackAmount = params.vnp_Amount;
    const transactionAmount = toVnpayAmount(transaction.amount);
    const orderAmount = toVnpayAmount(order.finalAmount);

    const amountMatches =
      transactionAmount !== null &&
      orderAmount !== null &&
      callbackAmount === transactionAmount &&
      callbackAmount === orderAmount;

    // 5. Dùng bộ quy tắc bạn đã test 9/9.
    return decideVnpayIpn({
      signatureValid: true,
      transactionFound: true,
      amountMatches,
      orderStatus: order.status,
      transactionStatus: transaction.status,
      paymentSuccessful: verified.success,
      orderExpired: new Date() >= order.expiresAt,
    });
  }
}
