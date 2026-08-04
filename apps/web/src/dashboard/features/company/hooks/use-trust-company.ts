import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useTrustCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyApi.trust(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(data.id) });
      toast.success("Company trusted for auto-approval");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to trust company")),
  });
}

export function useUntrustCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyApi.untrust(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(data.id) });
      toast.success("Company trust revoked");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to untrust company")),
  });
}
