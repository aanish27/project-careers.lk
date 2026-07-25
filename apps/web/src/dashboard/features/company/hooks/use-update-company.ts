import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import type { UpdateCompanyInput } from "../types/company.types";
import { companyKeys } from "./query-keys";

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCompanyInput }) =>
      companyApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: companyKeys.detail(variables.id),
      });
    },
  });
}
