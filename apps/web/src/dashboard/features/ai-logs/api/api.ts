import type { AiLogWithCompany } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface AiLogFilters {
  companyId?: number;
  scrapeLogId?: number;
  status?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const aiLogsApi = {
  list: (filters?: AiLogFilters) =>
    api
      .get<AiLogWithCompany[]>("/admin/ai-logs", { params: filters })
      .then((res) => res.data),
};
