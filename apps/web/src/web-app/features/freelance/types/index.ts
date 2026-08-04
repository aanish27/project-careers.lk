export interface PublicFreelancerProfile {
  id: number;
  webUserId: number;
  bio: string | null;
  rate: number | null;
  rateCurrency: string | null;
  category: string | null;
  skills: string[];
  portfolioLinks: string[];
  workHistory:
    | {
        title: string;
        organization: string;
        description?: string;
        startDate: string;
        endDate?: string;
      }[]
    | null;
  cvUrl: string | null;
  portfolioUrls: string[];
  createdAt: string;
  updatedAt: string;
  slug: string;
}

export interface PublicGig {
  id: number;
  postedByWebUserId: number;
  title: string;
  description: string | null;
  category: string | null;
  skills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  deadline: string | null;
  attachmentUrls: string[];
  createdAt: string;
  updatedAt: string;
  slug: string;
}
