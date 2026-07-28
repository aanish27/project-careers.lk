import type { Notification, NotificationListResponse } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const notificationsApi = {
  list: () =>
    api
      .get<NotificationListResponse>("/admin/notifications")
      .then((res) => res.data),
  markRead: (id: number) =>
    api
      .patch<Notification>(`/admin/notifications/${id}/read`)
      .then((res) => res.data),
  markAllRead: () =>
    api.patch<void>("/admin/notifications/read-all").then((res) => res.data),
};
