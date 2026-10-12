import { z } from 'zod';
import { TicketStatus } from '../constants/enums';

export const CheckInRequestSchema = z.object({
  qrToken: z.string().min(1),
  gateId: z.string().uuid(),
});
export type CheckInRequest = z.infer<typeof CheckInRequestSchema>;

export const RequestRefundSchema = z.object({
  ticketId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});
export type RequestRefund = z.infer<typeof RequestRefundSchema>;

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    timestamp: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
