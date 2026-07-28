import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success("Company deleted");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to delete company")),
  });
}
