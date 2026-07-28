import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "../api/api";
import { notificationsKeys } from "./query-keys";

/** Polled rather than invalidated by a mutation — new notifications arrive from a background worker, not from this client. */
const REFETCH_INTERVAL_MS = 30_000;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsKeys.lists(),
    queryFn: () => notificationsApi.list(),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to mark notification as read")),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.lists() });
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to mark notifications as read")),
  });
}
