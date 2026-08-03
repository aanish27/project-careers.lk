import { apiFetch, ApiError, extractCookieValue } from "@lib/api-client";
import "server-only";

export interface WebUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

// Called only from the OAuth callback Route Handler after this server has
// already exchanged the code with Google directly and confirmed the profile
// — the API trusts this call via the shared INTERNAL_API_KEY header rather
// than any credential of the web user's own (see InternalOnlyGuard on the API).
export async function googleUpsertRequest(
  profile: GoogleProfile,
): Promise<{ user: WebUser; accessToken: string; refreshToken: string }> {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    throw new Error("INTERNAL_API_KEY is not configured");
  }

  const { data, setCookies } = await apiFetch<{
    user: WebUser;
    accessToken: string;
  }>("/web-users/auth/google/upsert", {
    method: "POST",
    body: JSON.stringify(profile),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
  });

  const refreshToken = extractCookieValue(setCookies, "webUserRefreshToken");
  if (!refreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Google upsert response did not include a refresh token",
    );
  }

  return { user: data.user, accessToken: data.accessToken, refreshToken };
}

export async function webUserLogoutRequest(accessToken: string): Promise<void> {
  await apiFetch("/web-users/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchCurrentWebUser(
  accessToken: string,
): Promise<WebUser> {
  const { data } = await apiFetch<WebUser>("/web-users/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function webUserRefreshRequest(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{ accessToken: string }>(
    "/web-users/auth/refresh",
    {
      method: "POST",
      headers: { Cookie: `webUserRefreshToken=${refreshToken}` },
    },
  );

  const rotatedRefreshToken = extractCookieValue(
    setCookies,
    "webUserRefreshToken",
  );
  if (!rotatedRefreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Refresh response did not include a rotated refresh token",
    );
  }

  return { accessToken: data.accessToken, refreshToken: rotatedRefreshToken };
}
