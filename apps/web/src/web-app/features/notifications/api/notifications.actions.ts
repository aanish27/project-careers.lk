"use server";

import type { WebUserNotificationListResponse } from "@careerslk/types";
import {
  fetchMyNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@web-app-lib/web-user-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";

export type NotificationsActionResult =
  | { ok: true }
  | { requiresAuth: true }
  | { error: string };

export async function fetchMyNotifications(): Promise<
  { requiresAuth: true } | { data: WebUserNotificationListResponse }
> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  const data = await fetchMyNotificationsRequest(accessToken);
  return { data };
}

export async function markNotificationRead(
  id: number,
): Promise<NotificationsActionResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await markNotificationReadRequest(accessToken, id);
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function markAllNotificationsRead(): Promise<NotificationsActionResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await markAllNotificationsReadRequest(accessToken);
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
