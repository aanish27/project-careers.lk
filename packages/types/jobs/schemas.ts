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
// `workMode` and `employmentType` are required picks (the posting form has no
// "not specified" option for either). Location is a structured
// Province -> District -> City pick (city optional) rather than free text;
// the display `location` string and `seoLocationId` are derived server-side
// from these.
const webUserJobBaseSchema = z.object({
  title: z.string().min(1),
  province: z.string().min(1),
  district: z.string().min(1),
  city: z.string().optional(),
  workMode: z.enum(WEB_USER_WORK_MODES),
  employmentType: z.enum(WEB_USER_EMPLOYMENT_TYPES),
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

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

// Cross-field checks shared by create and update — applied after `.partial()`
// on the update variant since `.refine()` returns a ZodEffects that no
// longer exposes `.partial()`.
function withJobRefinements<
  T extends z.ZodType<{
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryRaw?: string;
    deadline?: string;
  }>,
>(schema: T) {
  return schema
    .refine(
      (data) =>
        data.salaryMin == null ||
        data.salaryMax == null ||
        data.salaryMax >= data.salaryMin,
      {
        message: 'Salary max cannot be lower than salary min',
        path: ['salaryMax'],
      },
    )
    .refine(
      (data) =>
        !(data.salaryMin != null || data.salaryMax != null || data.salaryRaw) ||
        !!data.salaryCurrency,
      {
        message: 'Currency is required when a salary is set',
        path: ['salaryCurrency'],
      },
    )
    .refine(
      (data) => !data.deadline || new Date(data.deadline) >= startOfToday(),
      {
        message: 'Application deadline cannot be in the past',
        path: ['deadline'],
      },
    );
}

export const createWebUserJobSchema = withJobRefinements(webUserJobBaseSchema);

export type CreateWebUserJobInput = z.infer<typeof createWebUserJobSchema>;

export const updateWebUserJobSchema = withJobRefinements(
  webUserJobBaseSchema.partial(),
);

export type UpdateWebUserJobInput = z.infer<typeof updateWebUserJobSchema>;
