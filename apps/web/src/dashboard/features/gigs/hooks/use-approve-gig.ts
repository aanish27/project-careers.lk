import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gigsApi } from "../api/api";
import { gigsKeys } from "./query-keys";

export function useApproveGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gigsApi.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gigsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gigsKeys.detail(data.id) });
      toast.success("Gig approved");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to approve gig")),
  });
}
