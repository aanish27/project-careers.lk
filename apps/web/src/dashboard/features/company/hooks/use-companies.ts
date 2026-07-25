import { useQuery } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: () => companyApi.list(),
  });
}
