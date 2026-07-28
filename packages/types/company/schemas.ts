import { z } from 'zod';
import { CompanyStatus, PaginationType } from '../enums';

export const createCompanySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.url().optional(),
  websiteUrl: z.url(),
  careerUrl: z.url(),
  status: z.enum(CompanyStatus),
  htmlSelector: z.string().optional(),
  htmlSelectorType: z.string().optional(),
  paginationBtn: z.string().optional(),
  paginationType: z.enum(PaginationType).optional(),
  atsPlatform: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
