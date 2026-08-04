import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { freelanceProfilesApi } from "../api/api";
import { freelanceProfilesKeys } from "./query-keys";

export function useApproveFreelanceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => freelanceProfilesApi.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: freelanceProfilesKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: freelanceProfilesKeys.detail(data.id),
      });
      toast.success("Freelance profile approved");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to approve freelance profile")),
  });
}
