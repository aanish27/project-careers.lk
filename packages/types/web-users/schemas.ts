import { z } from 'zod';

export const updateWebUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type UpdateWebUserProfileInput = z.infer<
  typeof updateWebUserProfileSchema
>;

export const requestEmailOtpSchema = z.object({
  email: z.email(),
});

export type RequestEmailOtpInput = z.infer<typeof requestEmailOtpSchema>;

export const verifyEmailOtpSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
