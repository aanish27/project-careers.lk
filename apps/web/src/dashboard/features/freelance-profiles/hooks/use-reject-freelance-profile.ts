import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RejectFreelanceProfileInput } from "../api/api";
import { freelanceProfilesApi } from "../api/api";
import { freelanceProfilesKeys } from "./query-keys";

export function useRejectFreelanceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: RejectFreelanceProfileInput;
    }) => freelanceProfilesApi.reject(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: freelanceProfilesKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: freelanceProfilesKeys.detail(data.id),
      });
      toast.success("Freelance profile rejected");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to reject freelance profile")),
  });
}
