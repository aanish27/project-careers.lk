import type {
  Company,
  CompanyScrapeSummary,
  CompanyWithScrapeSummary,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const companyApi = {
  list: () => api.get<Company[]>("/admin/companies").then((res) => res.data),
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
