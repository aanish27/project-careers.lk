import { z } from 'zod';
import { AbuseReportCategory, AbuseReportEntityType } from '../enums';

export const fileReportSchema = z.object({
  entityType: z.enum(AbuseReportEntityType),
  entityId: z.number().int().positive(),
  category: z.enum(AbuseReportCategory),
  details: z.string().max(2000).optional(),
});

export type FileReportInput = z.infer<typeof fileReportSchema>;

export const resolveReportSchema = z.object({
  resolutionNotes: z.string().max(2000).optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
