import { z } from 'zod';

export const startConversationSchema = z.object({
  otherWebUserId: z.number().int().positive(),
  gigId: z.number().int().positive().optional(),
  freelanceProfileId: z.number().int().positive().optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
