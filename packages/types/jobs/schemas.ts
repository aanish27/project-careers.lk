import { z } from 'zod';
import { EmploymentType, JobStatus } from '../enums';

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().optional(),
  workMode: z.string().optional(),
  employmentType: z.enum(EmploymentType).optional(),
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
