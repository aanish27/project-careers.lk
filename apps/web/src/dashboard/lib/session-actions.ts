"use server";

import { fetchCurrentUser } from "@lib/api-client";
import {
  createSession,
  destroySession,
  getSession,
  getValidAccessToken,
} from "./session";

/**
 * Re-reads /auth/me and rewrites the session cookie with the fresh
 * roles/permissions. Call after any mutation that could change the acting
 * user's own permissions (e.g. editing a role they hold) — otherwise their
 * session keeps the stale snapshot taken at login until it expires.
 */
export async function resyncSessionAction(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      await destroySession();
      return;
    }

    const user = await fetchCurrentUser(accessToken);
    await createSession({ ...session, user, accessToken });
  } catch {
    await destroySession();
  }
}
