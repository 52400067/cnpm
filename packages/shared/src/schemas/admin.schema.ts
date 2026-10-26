import { z } from "zod";

export const ReviewOrganizerSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(1).max(500).optional(),
    version: z.number().int().positive().optional(),
  })
  .strict()
  .refine((data) => data.decision === "APPROVE" || Boolean(data.reason), {
    message: "Từ chối hồ sơ phải có lý do",
    path: ["reason"],
  });

export type ReviewOrganizerDto = z.infer<typeof ReviewOrganizerSchema>;

export const ReviewEventSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(1).max(500).optional(),
    version: z.number().int().positive().optional(),
  })
  .strict()
  .refine((data) => data.decision === "APPROVE" || Boolean(data.reason), {
    message: "Từ chối sự kiện phải có lý do",
    path: ["reason"],
  });

export type ReviewEventDto = z.infer<typeof ReviewEventSchema>;

export const ApproveActionSchema = z
  .object({
    version: z.number().int().positive().optional(),
  })
  .strict();

export type ApproveActionDto = z.infer<typeof ApproveActionSchema>;

export const RejectActionSchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
    version: z.number().int().positive().optional(),
  })
  .strict();

export type RejectActionDto = z.infer<typeof RejectActionSchema>;
