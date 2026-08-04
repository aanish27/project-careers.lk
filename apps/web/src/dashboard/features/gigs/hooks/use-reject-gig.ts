import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RejectGigInput } from "../api/api";
import { gigsApi } from "../api/api";
import { gigsKeys } from "./query-keys";

export function useRejectGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: RejectGigInput }) =>
      gigsApi.reject(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gigsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gigsKeys.detail(data.id) });
      toast.success("Gig rejected");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to reject gig")),
  });
}
