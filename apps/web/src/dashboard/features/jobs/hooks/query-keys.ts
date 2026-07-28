export const jobsKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobsKeys.all, "list"] as const,
  list: (filters?: { companyId?: number }) =>
    [...jobsKeys.lists(), filters ?? {}] as const,
  details: () => [...jobsKeys.all, "detail"] as const,
  detail: (id: number) => [...jobsKeys.details(), id] as const,
};
