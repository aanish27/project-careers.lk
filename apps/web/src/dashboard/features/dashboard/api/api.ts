import { api } from "@dashboard-lib/axios";

interface QueueCounts {
  waiting: number;
  active: number;
  failed: number;
}

export interface DashboardStats {
  companies: { byScrapeStatus: Record<string, number> };
  jobs: { byStatus: Record<string, number> };
  lastScrapeRunAt: string | null;
  queues: {
    company: QueueCounts;
    jobs: QueueCounts;
  };
  llmCostThisMonth: {
    totalUsd: number;
    byModel: {
      model: string;
      provider: string;
      inputTokens: number;
      outputTokens: number;
      estimatedUsd: number | null;
    }[];
    byProvider: {
      provider: string;
      totalUsd: number;
      inputTokens: number;
      outputTokens: number;
    }[];
  };
}

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>("/admin/dashboard").then((res) => res.data),
};
