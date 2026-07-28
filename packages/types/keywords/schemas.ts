import { z } from 'zod';

export const createKeywordSchema = z.object({
  name: z.string().min(1),
});

export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;

export const updateKeywordSchema = createKeywordSchema.partial();

export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;

export const assignJobKeywordSchema = z.object({
  name: z.string().min(1),
  editedByAdmin: z.boolean().optional(),
});

export type AssignJobKeywordInput = z.infer<typeof assignJobKeywordSchema>;

export const updateJobKeywordSchema = z.object({
  editedByAdmin: z.boolean(),
});

export type UpdateJobKeywordInput = z.infer<typeof updateJobKeywordSchema>;
