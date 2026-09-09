import type { PublicJob } from "@web-app-features/jobs/types";

export interface SeoPageFaqItem {
  question: string;
  answer: string;
}

export interface SeoPageData {
  id: number;
  pageType: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  introText: string;
  bottomText: string;
  faqJson: SeoPageFaqItem[] | null;
  canonicalUrl: string;
  relatedLinksJson: string[];
  isIndexable: boolean;
  jobCount: number;
  companyCount: number;
  retiredAt: string | null;
}

export interface SeoRelatedLink {
  slug: string;
  title: string;
  h1: string;
}

export interface SeoPageResponse {
  page: SeoPageData;
  jobs: PublicJob[];
  relatedLinks: SeoRelatedLink[];
}

export interface SeoContentResponse {
  page: SeoPageData;
  relatedLinks: SeoRelatedLink[];
}

export interface SeoPageListItem {
  slug: string;
  pageType: string;
  lastmod: string;
}

export interface PseoSearchParams {
  province?: string;
  district?: string;
  workMode?: string;
  employmentType?: string;
  [key: string]: string | string[] | undefined;
}

export interface SeoSectorStat {
  sector: string;
  count: number;
}

export interface SeoLocationStat {
  district: string;
  count: number;
}

export interface SeoPublicStats {
  totalJobs: number;
  totalCompanies: number;
  bySector: SeoSectorStat[];
  byLocation: SeoLocationStat[];
}

export interface SeoJobsPublic {
  stats: SeoPublicStats;
}
