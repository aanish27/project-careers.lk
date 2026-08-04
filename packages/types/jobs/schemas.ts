import { z } from 'zod';
import { EmploymentType, JobStatus } from '../enums';

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().optional(),
  workMode: z.string().optional(),
  employmentType: z.enum(EmploymentType).optional(),
  sector: z.string().optional(),
  roleCategory: z.string().optional(),
  department: z.string().optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  salaryCurrency: z.string().optional(),
  salaryRaw: z.string().optional(),
  description: z.string().optional(),
  deadline: z.iso.datetime().optional(),
  applyUrl: z.url().optional(),
  status: z.enum(JobStatus).optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const rejectJobSchema = z.object({
  reason: z.string().min(1),
});

export type RejectJobInput = z.infer<typeof rejectJobSchema>;

// A web user's own job submission — no `companyId`/`status`/approval fields,
// those are derived server-side from the caller's linked company.
export const createWebUserJobSchema = z.object({
  title: z.string().min(1),
  location: z.string().optional(),
  workMode: z.string().optional(),
  employmentType: z.enum(EmploymentType).optional(),
  sector: z.string().optional(),
  roleCategory: z.string().optional(),
  department: z.string().optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  salaryCurrency: z.string().optional(),
  salaryRaw: z.string().optional(),
  description: z.string().optional(),
  deadline: z.iso.datetime().optional(),
  applyUrl: z.url().optional(),
});

export type CreateWebUserJobInput = z.infer<typeof createWebUserJobSchema>;

export const updateWebUserJobSchema = createWebUserJobSchema.partial();

export type UpdateWebUserJobInput = z.infer<typeof updateWebUserJobSchema>;
