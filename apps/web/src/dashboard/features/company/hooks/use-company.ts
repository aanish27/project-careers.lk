import { useQuery } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCompany(id: number) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyApi.get(id),
    enabled: Number.isFinite(id),
  });
}
