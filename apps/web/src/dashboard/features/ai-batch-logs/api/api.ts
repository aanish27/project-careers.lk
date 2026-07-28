import type { AiBatchLog } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface AiBatchLogFilters {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const aiBatchLogsApi = {
  list: (filters?: AiBatchLogFilters) =>
    api
      .get<AiBatchLog[]>("/admin/ai-batch-logs", { params: filters })
      .then((res) => res.data),
};
