import { useQuery } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCompanyScrapeSummaries() {
  return useQuery({
    queryKey: [...companyKeys.all, "scrape-summary"] as const,
    queryFn: () => companyApi.scrapeSummaries(),
  });
}
