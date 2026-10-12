import { z } from 'zod';
import { UserRole, UserStatus, OrganizerStatus } from '../constants/enums';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(150),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/).optional(),
  role: z.enum([UserRole.BUYER, UserRole.ORGANIZER]).default(UserRole.BUYER),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const SubmitOrganizerProfileSchema = z.object({
  organizationName: z.string().min(2).max(255),
  taxCode: z.string().min(10).max(50),
  businessLicenseUrl: z.string().url(),
  representativeName: z.string().min(2).max(150),
});
export type SubmitOrganizerProfile = z.infer<typeof SubmitOrganizerProfileSchema>;

export const ReviewOrganizerProfileSchema = z.object({
  status: z.enum([OrganizerStatus.VERIFIED, OrganizerStatus.REJECTED]),
  rejectionReason: z.string().optional(),
});
export type ReviewOrganizerProfile = z.infer<typeof ReviewOrganizerProfileSchema>;
