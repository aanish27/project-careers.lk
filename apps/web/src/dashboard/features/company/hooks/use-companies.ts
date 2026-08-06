import type { CompanyAutoApprovalStatus } from "@careerslk/types";
import { useQuery } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCompanies(autoApprovalStatus?: CompanyAutoApprovalStatus) {
  return useQuery({
    queryKey: companyKeys.list(autoApprovalStatus),
    queryFn: () => companyApi.list({ autoApprovalStatus }),
  });
}
