import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { jobsApi } from "../api/api";
import { jobsKeys } from "./query-keys";

export function useApproveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => jobsApi.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.detail(data.id) });
      toast.success("Job approved");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to approve job")),
  });
}
