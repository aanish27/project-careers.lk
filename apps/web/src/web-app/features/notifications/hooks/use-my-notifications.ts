"use client";

import { useWebUser } from "@jobboard/providers/web-user-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.actions";

const REFETCH_INTERVAL_MS = 30_000;

const EMPTY_LIST = { items: [], unreadCount: 0 };

const notificationsKeys = {
  all: ["web-user-notifications"] as const,
  lists: () => [...notificationsKeys.all, "list"] as const,
};

export function useMyNotifications() {
  const { isLoggedIn } = useWebUser();

  return useQuery({
    queryKey: notificationsKeys.lists(),
    queryFn: async () => {
      const result = await fetchMyNotifications();
      return "requiresAuth" in result ? EMPTY_LIST : result.data;
    },
    enabled: isLoggedIn,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.lists(),
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.lists(),
      });
    },
  });
}
