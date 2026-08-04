import { z } from 'zod';

export const workHistoryEntrySchema = z.object({
  title: z.string().min(1),
  organization: z.string().min(1),
  description: z.string().optional(),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional(),
});

export type WorkHistoryEntry = z.infer<typeof workHistoryEntrySchema>;

export const workHistorySchema = z.array(workHistoryEntrySchema).max(20);

// A web user's own freelance profile — approval fields are derived
// server-side, never accepted from the client.
export const createFreelanceProfileSchema = z.object({
  bio: z.string().max(5000).optional(),
  rate: z.number().int().nonnegative().optional(),
  rateCurrency: z.string().optional(),
  category: z.string().optional(),
  skills: z.array(z.string().min(1)).max(30).default([]),
  portfolioLinks: z.array(z.url()).max(10).default([]),
  workHistory: workHistorySchema.optional(),
});

export type CreateFreelanceProfileInput = z.infer<
  typeof createFreelanceProfileSchema
>;

export const updateFreelanceProfileSchema =
  createFreelanceProfileSchema.partial();

export type UpdateFreelanceProfileInput = z.infer<
  typeof updateFreelanceProfileSchema
>;

// Both fields are optional and independent: `reason` is shown to the
// submitter, `internalNotes` stays admin-only — a rejection can carry
// either, both, or (rare) neither.
export const rejectFreelanceProfileSchema = z.object({
  reason: z.string().min(1).optional(),
  internalNotes: z.string().min(1).optional(),
});

export type RejectFreelanceProfileInput = z.infer<
  typeof rejectFreelanceProfileSchema
>;

export const createGigSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(5000).optional(),
  category: z.string().optional(),
  skills: z.array(z.string().min(1)).max(30).default([]),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  budgetCurrency: z.string().optional(),
  deadline: z.iso.datetime().optional(),
});

export type CreateGigInput = z.infer<typeof createGigSchema>;

export const updateGigSchema = createGigSchema.partial();

export type UpdateGigInput = z.infer<typeof updateGigSchema>;

export const rejectGigSchema = rejectFreelanceProfileSchema;

export type RejectGigInput = z.infer<typeof rejectGigSchema>;
