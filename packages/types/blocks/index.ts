import { z } from 'zod';

export const blockUserSchema = z.object({
  blockedWebUserId: z.number().int().positive(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

export interface WebUserBlock {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt: string;
}

export interface BlockedWebUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}
