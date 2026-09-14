import { z } from 'zod';
import { createWebUserCompanySchema } from '../company';
import { EmploymentType, JobStatus } from '../enums';
import { emptyToUndefined } from '../lib/zod-utils';

export const WEB_USER_SALARY_PERIODS = ['monthly', 'annual'] as const;

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
  salaryPeriod: z.enum(WEB_USER_SALARY_PERIODS).optional(),
  salaryRaw: z.string().optional(),
  description: z.string().optional(),
  deadline: z.iso.datetime().optional(),
  applyUrl: z.url().optional(),
  cvEmail: z.email().optional(),
  walkIn: z.boolean().optional(),
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
  'contract',
  'internship',
  'talent_pool',
] as const;

export const WEB_USER_WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;

// A web user's own job submission — no `companyId`/`status`/approval fields.
// `workMode` and `employmentType` are required picks (the posting form has no
// "not specified" option for either). Location is a structured
// Province -> District -> City pick (city optional) rather than free text;
// the display `location` string and `seoLocationId` are derived server-side
// from these.
export const webUserJobBaseSchema = z.object({
  title: z.string().min(1, 'This field is required'),
  // Required unless workMode is 'remote' — enforced in withJobRefinements
  // since it depends on the sibling `workMode` field.
  province: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  workMode: z.enum(WEB_USER_WORK_MODES, 'This field is required'),
  employmentType: z.enum(WEB_USER_EMPLOYMENT_TYPES, 'This field is required'),
  sector: z.string().min(1, 'This field is required'),
  roleCategory: z.string().min(1, 'This field is required'),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  salaryCurrency: z.string().optional(),
  // Required whenever any salary field is set (range or freeform) —
  // enforced in withJobRefinements, same condition as salaryCurrency.
  salaryPeriod: z.enum(WEB_USER_SALARY_PERIODS).optional(),
  // Mutually exclusive with salaryMin/salaryMax — enforced in
  // withJobRefinements — a poster picks either a numeric range or freeform
  // text, not both.
  salaryRaw: z.string().optional(),
  description: z.string().min(1, 'This field is required'),
  // `emptyToUndefined` — a form naturally defaults these to `""`, but
  // `.optional()` alone only accepts `undefined`; an untouched `""` would
  // otherwise fail the url/email/datetime format check.
  deadline: emptyToUndefined(z.iso.datetime().optional()),
  applyUrl: emptyToUndefined(z.url().optional()),
  cvEmail: emptyToUndefined(z.email().optional()),
  walkIn: z.boolean().optional(),
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
    salaryPeriod?: string;
    salaryRaw?: string;
    deadline?: string;
    workMode?: (typeof WEB_USER_WORK_MODES)[number];
    province?: string;
    district?: string;
    applyUrl?: string;
    cvEmail?: string;
    walkIn?: boolean;
  }>,
>(schema: T) {
  return schema
    .refine((data) => data.workMode === 'remote' || !!data.province, {
      message: 'Province is required unless the job is remote',
      path: ['province'],
    })
    .refine((data) => data.workMode === 'remote' || !!data.district, {
      message: 'District is required unless the job is remote',
      path: ['district'],
    })
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
      (data) =>
        !(data.salaryRaw && (data.salaryMin != null || data.salaryMax != null)),
      {
        message: 'Choose either a salary range or freeform text, not both',
        path: ['salaryRaw'],
      },
    )
    .refine(
      (data) =>
        !(data.salaryMin != null || data.salaryMax != null || data.salaryRaw) ||
        !!data.salaryPeriod,
      {
        message: 'Select whether this salary is monthly or annual',
        path: ['salaryPeriod'],
      },
    )
    .refine(
      (data) => !data.deadline || new Date(data.deadline) >= startOfToday(),
      {
        message: 'Application deadline cannot be in the past',
        path: ['deadline'],
      },
    )
    .refine((data) => !!data.walkIn || !!data.applyUrl || !!data.cvEmail, {
      message:
        'Provide an apply URL or CV email, or mark this as a walk-in role',
      path: ['applyUrl'],
    });
}

export const postJobCompanySchema = createWebUserCompanySchema.pick({
  name: true,
  websiteUrl: true,
});

export type PostJobCompanyInput = z.infer<typeof postJobCompanySchema>;

export const createWebUserJobSchema = withJobRefinements(webUserJobBaseSchema);

export type CreateWebUserJobInput = z.infer<typeof createWebUserJobSchema>;

// The combined payload for posting a job in one request — `company` is
// present only when the poster has no linked company yet (creating one and
// creating the job happen in the same backend transaction, so a failure in
// either rolls back both).
export const postJobRequestSchema = z.object({
  company: postJobCompanySchema.optional(),
  job: createWebUserJobSchema,
});

export type PostJobRequestInput = z.infer<typeof postJobRequestSchema>;

export const updateWebUserJobSchema = withJobRefinements(
  webUserJobBaseSchema.partial(),
);

export type UpdateWebUserJobInput = z.infer<typeof updateWebUserJobSchema>;

export const webJobFormSchema = z.object({
  ...webUserJobBaseSchema.shape,
  ...postJobCompanySchema.shape,
  // Kept out of `webUserJobBaseSchema`/`createWebUserJobSchema` — those are
  // spread into the JSON body sent to the API, and a `File` can't survive
  // `JSON.stringify`. Uploaded separately via `uploadJobImageRequest` after
  // the job is created.
  image: z
    .instanceof(File)
    .refine((file) => file.type.startsWith('image/'), 'File must be an image')
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be under 5MB')
    .optional(),
});

export type WebJobFormInput = z.infer<typeof webJobFormSchema>;
