import type { Company } from '../company';
import type {
  EmploymentType,
  JobApprovalStatus,
  JobSource,
  JobStatus,
  WorkMode,
} from '../enums';
import type { Keyword } from '../keywords';

export * from './schemas';

export interface Job {
  id: number;
  companyId: number;
  batchId: string | null;
  title: string;
  slug: string;
  province: string | null;
  district: string | null;
  city: string | null;
  workMode: WorkMode | null;
  employmentType: EmploymentType | null;
  sector: string | null;
  roleCategory: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryRaw: string | null;
  description: string | null;
  imageUrl: string | null;
  deadline: string | null;
  applyUrl: string | null;
  status: JobStatus;
  lastSeenAt: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  source: JobSource;
  postedByWebUserId: number | null;
  approvalStatus: JobApprovalStatus;
  approvedByAdminId: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
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
