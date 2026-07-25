import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}
