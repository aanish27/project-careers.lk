import type {
  ClaimStatus,
  Company,
  CompanyAutoApprovalStatus,
  CompanyScrapeSummary,
  CompanyWithScrapeSummary,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface CompanyClaim {
  id: number;
  webUserId: number;
  companyId: number;
  status: ClaimStatus;
  reviewedByAdminId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  webUser: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  company: {
    id: number;
    name: string;
    websiteUrl: string;
    logoUrl: string | null;
  };
}

export const companyApi = {
  list: (filters?: { autoApprovalStatus?: CompanyAutoApprovalStatus }) =>
    api
      .get<Company[]>("/admin/companies", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api
      .get<CompanyWithScrapeSummary>(`/admin/companies/${id}`)
      .then((res) => res.data),
  create: (body: CreateCompanyInput) =>
    api.post<Company>("/admin/companies", body).then((res) => res.data),
  update: (id: number, body: UpdateCompanyInput) =>
    api.patch<Company>(`/admin/companies/${id}`, body).then((res) => res.data),
  remove: (id: number) =>
    api.delete<Company>(`/admin/companies/${id}`).then((res) => res.data),
  scrapeSummaries: () =>
    api
      .get<CompanyScrapeSummary[]>("/admin/companies/scrape-summary")
      .then((res) => res.data),
  trust: (id: number) =>
    api.post<Company>(`/admin/companies/${id}/trust`).then((res) => res.data),
  untrust: (id: number) =>
    api.post<Company>(`/admin/companies/${id}/untrust`).then((res) => res.data),
};

export const companyClaimsApi = {
  list: (status?: ClaimStatus) =>
    api
      .get<CompanyClaim[]>("/admin/companies/claims", { params: { status } })
      .then((res) => res.data),
  approve: (id: number) =>
    api
      .post<CompanyClaim>(`/admin/companies/claims/${id}/approve`)
      .then((res) => res.data),
  reject: (id: number) =>
    api
      .post<CompanyClaim>(`/admin/companies/claims/${id}/reject`)
      .then((res) => res.data),
};

interface ScrapeQueuedResponse {
  queued: boolean;
  message: string;
}

export const scraperApi = {
  scrapeJob: (id: number) =>
    api
      .post<ScrapeQueuedResponse>(`/admin/scraper/jobs/${id}`)
      .then((res) => res.data),
  scrapeCompany: (id: number) =>
    api
      .post<ScrapeQueuedResponse>(`/admin/scraper/companies/${id}`)
      .then((res) => res.data),
  scrapeJobs: (ids: number[]) =>
    api
      .post<ScrapeQueuedResponse>("/admin/scraper/jobs", { ids })
      .then((res) => res.data),
  scrapeCompanies: (ids: number[]) =>
    api
      .post<ScrapeQueuedResponse>("/admin/scraper/companies", { ids })
      .then((res) => res.data),
};
