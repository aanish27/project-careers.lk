import type {
  CompanyAutoApprovalStatus,
  CompanyStatus,
  PaginationType,
} from '../enums';

export * from './schemas';

export interface Company {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  careerUrl: string | null;
  atsPlatform: string | null;
  status: CompanyStatus;
  scrapeStatus: string;
  lastScrapedAt: string | null;
  htmlSelector: string | null;
  htmlSelectorType: string | null;
  paginationType: PaginationType | null;
  paginationBtn: string | null;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  createdByWebUserId: number | null;
  autoApproveJobs: boolean;
  autoApprovalStatus: CompanyAutoApprovalStatus;
  autoApprovalRequestedAt: string | null;
}

export interface CompanyScrapeSummary {
  companyId: number;
  companyName: string;
  activeJobs: number;
  expiredJobs: number;
  lastScrape: {
    id: number;
    status: string;
    jobsFound: number;
    errorMessage: string | null;
    durationMs: number;
    createdAt: string;
  } | null;
}

export interface CompanyWithScrapeSummary extends Company {
  scrapeSummary: CompanyScrapeSummary | null;
}
