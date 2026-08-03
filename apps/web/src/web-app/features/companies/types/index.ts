import type { PublicJob } from "@web-app-features/jobs/types";

export interface PublicCompany {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string;
}

export interface PublicCompanyResponse {
  company: PublicCompany;
  activeJobCount: number;
}

export interface PublicCompanyJobsResponse {
  company: Pick<PublicCompany, "id" | "name" | "slug" | "logoUrl">;
  jobs: PublicJob[];
}
