import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"] as const,
    queryFn: () => dashboardApi.getStats(),
  });
}
