import { useQuery } from "@tanstack/react-query";
import { aiCostApi } from "../api/api";

export function useDeepSeekBalance() {
  return useQuery({
    queryKey: ["ai-cost", "deepseek-balance"] as const,
    queryFn: () => aiCostApi.deepSeekBalance(),
  });
}
