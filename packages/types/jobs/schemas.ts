import { z } from 'zod';
import { EmploymentType, JobStatus } from '../enums';

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  workMode: z.string().optional(),
  employmentType: z.enum(EmploymentType).optional(),
  sector: z.string().optional(),
  roleCategory: z.string().optional(),
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

// Freelance work is its own marketplace (gigs) — not an employment type a
// web user can post a regular job listing under.
export const WEB_USER_EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
] as const;

export const WEB_USER_WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;

// A web user's own job submission — no `companyId`/`status`/approval fields.
// `workMode` is a required pick (the posting form has no "not specified"
// option). Location is a structured Province -> District -> City pick (city
// optional) rather than free text; the display `location` string and
// `seoLocationId` are derived server-side from these.
export const createWebUserJobSchema = z.object({
  title: z.string().min(1),
  province: z.string().min(1),
  district: z.string().min(1),
  city: z.string().optional(),
  workMode: z.enum(WEB_USER_WORK_MODES),
  employmentType: z.enum(WEB_USER_EMPLOYMENT_TYPES).optional(),
  sector: z.string().optional(),
  roleCategory: z.string().optional(),
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
