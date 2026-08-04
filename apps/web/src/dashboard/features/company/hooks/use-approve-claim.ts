import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyClaimsApi } from "../api/api";
import { companyClaimsKeys } from "./query-keys";

export function useApproveClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyClaimsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyClaimsKeys.lists() });
      toast.success("Claim approved");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to approve claim")),
  });
}
