import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyClaimsApi } from "../api/api";
import { companyClaimsKeys } from "./query-keys";

export function useRejectClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyClaimsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyClaimsKeys.lists() });
      toast.success("Claim rejected");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to reject claim")),
  });
}
