import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ResolveReportInput } from "../api/api";
import { reportsApi } from "../api/api";
import { reportsKeys } from "./query-keys";

export function useDismissReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ResolveReportInput }) =>
      reportsApi.dismiss(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reportsKeys.detail(data.id) });
      toast.success("Report dismissed");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to dismiss report")),
  });
}
