import { z } from 'zod';
import { CompanyStatus, PaginationType } from '../enums';
import { emptyToUndefined } from '../lib/zod-utils';

const urlMessage = 'Enter a valid URL, e.g. https://example.com';
const phoneMessage = 'Enter a valid phone number';
const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

// A form naturally defaults these to `""`; `.optional()` alone only
// accepts `undefined`, so an untouched/cleared field would otherwise fail
// the URL format check.
const socialLinksSchema = {
  linkedinUrl: emptyToUndefined(z.url(urlMessage).optional()),
  twitterUrl: emptyToUndefined(z.url(urlMessage).optional()),
  facebookUrl: emptyToUndefined(z.url(urlMessage).optional()),
  instagramUrl: emptyToUndefined(z.url(urlMessage).optional()),
};

export const createCompanySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.url(urlMessage).optional(),
  websiteUrl: z.url(urlMessage),
  careerUrl: z.url(urlMessage),
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
  name: z.string().min(1, 'This field is required'),
  // A form naturally defaults this to `""`; `.optional()` alone only
  // accepts `undefined`, so an untouched field would otherwise fail the
  // URL format check.
  websiteUrl: emptyToUndefined(z.url(urlMessage).optional()),
  careerUrl: z.url(urlMessage).optional(),
  logoUrl: z.url(urlMessage).optional(),
  description: z.string().optional(),
  // All optional — a company can be created with just a name and filled in
  // fully later from the company profile page.
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  contactNumber: emptyToUndefined(
    z.string().regex(phoneRegex, phoneMessage).optional(),
  ),
  ...socialLinksSchema,
});

export type CreateWebUserCompanyInput = z.infer<
  typeof createWebUserCompanySchema
>;

export const updateWebUserCompanySchema = createWebUserCompanySchema.partial();

export type UpdateWebUserCompanyInput = z.infer<
  typeof updateWebUserCompanySchema
>;

export const denyTrustSchema = z.object({
  reason: z.string().min(1),
});

export type DenyTrustInput = z.infer<typeof denyTrustSchema>;
