import type { UpdateSeoPageInput } from "@careerslk/types";
import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { seoAdminApi } from "../api/api";
import { seoKeys } from "./query-keys";

export function useUpdateSeoPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSeoPageInput }) =>
      seoAdminApi.update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seoKeys.detail(variables.id) });
      toast.success("SEO page updated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to update SEO page")),
  });
}
