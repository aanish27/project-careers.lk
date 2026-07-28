import type {
  ClaudeUsageResponse,
  DeepSeekBalanceResponse,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const aiCostApi = {
  claudeUsage: () =>
    api
      .get<ClaudeUsageResponse>("/admin/ai-cost/claude-usage")
      .then((res) => res.data),
  deepSeekBalance: () =>
    api
      .get<DeepSeekBalanceResponse>("/admin/ai-cost/deepseek-balance")
      .then((res) => res.data),
};
