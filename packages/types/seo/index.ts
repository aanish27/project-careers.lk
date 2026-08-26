import type { SeoPageType } from '../enums';

export * from './schemas';

/** SRS 12.11.3 — minimum active job count for a page to be indexable. */
export const SEO_PAGE_THRESHOLDS: Record<SeoPageType, number> = {
  SECTOR: 15,
  ROLE: 10,
  LOCATION: 15,
  ROLE_LOCATION: 5,
  SKILL: 8,
  COMPANY: 3,
  REMOTE: 5,
  INTERNSHIP: 5,
  // Always indexable — a single static page, not a generated aggregate.
  ALL_JOBS: 0,
  HOME: 0,
} as const;

/** SRS 12.13.3 — grace period before an under-threshold page deactivates. */
export const SEO_DEACTIVATION_GRACE_DAYS = 14;

/** SRS 12.13.2 / FR-SEO-10 — days a deactivated page waits before 410. */
export const SEO_RETIREMENT_DAYS = 90;

/** SRS 12.11.4 — aggregated stats used to fill in template content. */
export interface SeoInputObject {
  pageType: SeoPageType;
  sector?: string;
  role?: string;
  location?: string;
  company?: string;
  skill?: string;
  jobCount: number;
  companyCount: number;
  topSkills: string[];
  jobTypes: string[];
  workModes: string[];
}

export interface SeoPageFaqItem {
  question: string;
  answer: string;
}

export interface SeoPageSummary {
  id: number;
  pageType: SeoPageType;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  isIndexable: boolean;
  manualOverride: boolean;
  needsReview: boolean;
  jobCount: number;
  companyCount: number;
  lastGeneratedAt: string;
  lastmod: string;
}

export interface SeoPageDetail extends SeoPageSummary {
  introText: string;
  bottomText: string;
  faqJson: SeoPageFaqItem[] | null;
  canonicalUrl: string;
  relatedLinksJson: string[];
  contentVersion: number;
  lastReviewedAt: string | null;
  validationIssues: string[] | null;
  deactivatedAt: string | null;
  retiredAt: string | null;
}
