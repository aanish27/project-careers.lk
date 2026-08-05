import { z } from 'zod';
import { CompanyStatus, PaginationType } from '../enums';

const socialLinksSchema = {
  linkedinUrl: z.url().optional(),
  twitterUrl: z.url().optional(),
  facebookUrl: z.url().optional(),
  instagramUrl: z.url().optional(),
};

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
  ...socialLinksSchema,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// A web user creating a brand-new (unclaimed) company — no scrape-config
// fields, and no `status` (always active immediately).
export const createWebUserCompanySchema = z.object({
  name: z.string().min(1),
  websiteUrl: z.url().optional(),
  careerUrl: z.url().optional(),
  logoUrl: z.url().optional(),
  description: z.string().optional(),
  ...socialLinksSchema,
});

export type CreateWebUserCompanyInput = z.infer<
  typeof createWebUserCompanySchema
>;

export const updateWebUserCompanySchema = createWebUserCompanySchema
  .omit({ websiteUrl: true })
  .partial();

export type UpdateWebUserCompanyInput = z.infer<
  typeof updateWebUserCompanySchema
>;
