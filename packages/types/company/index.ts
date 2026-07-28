import type { CompanyStatus, PaginationType } from '../enums';

export * from './schemas';

export interface Company {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  careerUrl: string;
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
