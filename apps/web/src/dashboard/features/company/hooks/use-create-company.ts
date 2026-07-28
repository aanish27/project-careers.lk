import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success("Company created");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to create company")),
  });
}
