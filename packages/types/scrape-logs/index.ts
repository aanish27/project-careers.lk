import type { Company } from '../company';

export interface ScrapeLog {
  id: number;
  companyId: number;
  triggeredBy: string;
  jobsFound: number;
  status: string;
  errorMessage: string | null;
  durationMs: number;
  htmlLength: number | null;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeLogWithCompany extends ScrapeLog {
  company: Pick<Company, 'id' | 'name'>;
}
