export interface PublicJobCompany {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface PublicJobSkill {
  name: string;
  type: "EXPLICIT" | "INFERRED";
}

export interface PublicJob {
  id: number;
  title: string;
  slug: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
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
  lastSeenAt: string;
  source: "SCRAPED" | "POSTED";
  company: PublicJobCompany;
  skills: PublicJobSkill[];
}

export interface PublicJobsListResponse {
  items: PublicJob[];
  nextCursor: string | null;
}

export interface PublicJobKeyword {
  keyword: { id: number; name: string };
}

export interface PublicJobDetail extends Omit<PublicJob, "company"> {
  status: "ACTIVE" | "EXPIRED";
  keywords: PublicJobKeyword[];
  company: PublicJobCompany & { websiteUrl: string };
}

export interface RelatedJobSummary {
  id: number;
  slug: string;
  title: string;
}

export interface RelatedJobWithCompany extends RelatedJobSummary {
  company: { name: string };
}

export interface PublicJobDetailResponse {
  job: PublicJobDetail;
  canonicalSlug: string;
  isStaleSlug: boolean;
  relatedJobs: {
    sameCompany: RelatedJobSummary[];
    sameRole: RelatedJobWithCompany[];
  };
}
