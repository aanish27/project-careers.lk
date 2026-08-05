import type { UpdateJobInput } from "@careerslk/types";
import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { jobsApi } from "../api/api";
import { jobsKeys } from "./query-keys";

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateJobInput }) =>
      jobsApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: jobsKeys.detail(variables.id),
      });
      toast.success("Job updated");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to update job")),
  });
}
