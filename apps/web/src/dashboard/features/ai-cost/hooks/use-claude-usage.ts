import { useQuery } from "@tanstack/react-query";
import { aiCostApi } from "../api/api";

export function useClaudeUsage() {
  return useQuery({
    queryKey: ["ai-cost", "claude-usage"] as const,
    queryFn: () => aiCostApi.claudeUsage(),
  });
}
