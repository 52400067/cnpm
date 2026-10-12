import { z } from 'zod';
import { OrderStatus, PaymentProvider } from '../constants/enums';

export const HoldSeatItemSchema = z.object({
  seatId: z.string().uuid().optional(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});
export type HoldSeatItem = z.infer<typeof HoldSeatItemSchema>;

export const HoldSeatsRequestSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(HoldSeatItemSchema).min(1).max(6),
});
export type HoldSeatsRequest = z.infer<typeof HoldSeatsRequestSchema>;

export const ReleaseHoldRequestSchema = z.object({
  orderId: z.string().uuid(),
});
export type ReleaseHoldRequest = z.infer<typeof ReleaseHoldRequestSchema>;

export const CreatePaymentRequestSchema = z.object({
  orderId: z.string().uuid(),
  voucherCode: z.string().optional(),
  bankCode: z.string().optional(),
});
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
