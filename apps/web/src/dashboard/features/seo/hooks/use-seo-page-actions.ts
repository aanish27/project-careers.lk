import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { seoAdminApi } from "../api/api";
import { seoKeys } from "./query-keys";

export function useRegenerateSeoPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }: { id: number; force?: boolean }) =>
      seoAdminApi.regenerate(id, force),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seoKeys.detail(variables.id) });
      toast.success("Page regenerated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to regenerate page")),
  });
}

export function useDeactivateSeoPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => seoAdminApi.deactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seoKeys.detail(id) });
      toast.success("Page deactivated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to deactivate page")),
  });
}

export function useReactivateSeoPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => seoAdminApi.reactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: seoKeys.detail(id) });
      toast.success("Page reactivated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to reactivate page")),
  });
}

export function useGenerateAllSeoPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => seoAdminApi.generateAll(),
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.lists() });
      toast.success(
        `Generation complete: ${summary.created} created, ${summary.updated} updated`,
      );
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to run generation")),
  });
}
