export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
};
