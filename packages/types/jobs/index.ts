import type { Company } from '../company';
import type { JobStatus } from '../enums';

export interface Job {
  id: number;
  companyId: number;
  title: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
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
