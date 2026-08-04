import type { ClaimStatus } from "@careerslk/types";
import { useQuery } from "@tanstack/react-query";
import { companyClaimsApi } from "../api/api";
import { companyClaimsKeys } from "./query-keys";

export function useCompanyClaims(status?: ClaimStatus) {
  return useQuery({
    queryKey: companyClaimsKeys.list(status),
    queryFn: () => companyClaimsApi.list(status),
  });
}
