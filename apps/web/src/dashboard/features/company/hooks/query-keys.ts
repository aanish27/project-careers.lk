import type { ClaimStatus, CompanyAutoApprovalStatus } from "@careerslk/types";

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (autoApprovalStatus?: CompanyAutoApprovalStatus) =>
    [...companyKeys.lists(), autoApprovalStatus ?? "ALL"] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
};

export const companyClaimsKeys = {
  all: ["company-claims"] as const,
  lists: () => [...companyClaimsKeys.all, "list"] as const,
  list: (status?: ClaimStatus) =>
    [...companyClaimsKeys.lists(), status ?? "ALL"] as const,
};
