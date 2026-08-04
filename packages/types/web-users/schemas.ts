import { z } from 'zod';

export const updateWebUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type UpdateWebUserProfileInput = z.infer<
  typeof updateWebUserProfileSchema
>;
