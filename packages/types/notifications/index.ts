export type NotificationType = 'SCRAPE_COMPLETED' | 'SCRAPE_FAILED';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata: unknown;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unreadCount: number;
}
