import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { jobsApi } from "../api/api";
import { jobsKeys } from "./query-keys";

export function useRejectJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      jobsApi.reject(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.detail(data.id) });
      toast.success("Job rejected");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to reject job")),
  });
}
