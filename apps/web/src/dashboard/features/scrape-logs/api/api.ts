import type { ScrapeLogDetail, ScrapeLogWithCompany } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface ScrapeLogFilters {
  status?: string;
  company?: string;
  companyId?: number;
  triggeredBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const scrapeLogsApi = {
  list: (filters?: ScrapeLogFilters) =>
    api
      .get<ScrapeLogWithCompany[]>("/admin/scrape-logs", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api
      .get<ScrapeLogDetail>(`/admin/scrape-logs/${id}`)
      .then((res) => res.data),
};
