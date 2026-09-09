import type { PublicJob } from "@web-app-features/jobs/types";

export interface PublicCompany {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string;
  description: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

export interface PublicCompanyResponse {
  company: PublicCompany;
  activeJobCount: number;
}

export interface PublicCompanyJobsResponse {
  company: Pick<
    PublicCompany,
    | "id"
    | "name"
    | "slug"
    | "logoUrl"
    | "websiteUrl"
    | "description"
    | "linkedinUrl"
    | "twitterUrl"
    | "facebookUrl"
    | "instagramUrl"
  >;
  jobs: PublicJob[];
}
