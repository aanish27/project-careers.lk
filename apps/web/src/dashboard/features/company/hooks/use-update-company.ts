import type { UpdateCompanyInput } from "@careerslk/types";
import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyApi } from "../api/api";
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
      toast.success("Company updated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to update company")),
  });
}
