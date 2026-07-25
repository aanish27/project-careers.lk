import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}
