import type { Company } from '../company';
import type { JobStatus } from '../enums';
import type { Keyword } from '../keywords';

export * from './schemas';

export interface Job {
  id: number;
  companyId: number;
  batchId: string | null;
  title: string;
  slug: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  sector: string | null;
  roleCategory: string | null;
  department: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryRaw: string | null;
  description: string | null;
  deadline: string | null;
  applyUrl: string | null;
  status: JobStatus;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithCompany extends Job {
  company: Pick<Company, 'id' | 'name' | 'logoUrl'>;
}

export interface JobKeywordWithName {
  keywordId: number;
  editedByAdmin: boolean;
  keyword: Pick<Keyword, 'id' | 'name'>;
}

export interface JobDetail extends JobWithCompany {
  keywords: JobKeywordWithName[];
}
