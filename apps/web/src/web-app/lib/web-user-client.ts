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

// The shared secret proving these calls come from this server (see
// InternalOnlyGuard on the API) — required on every web-user-auth endpoint
// that either trusts an externally-verified profile (Google) or needs
// per-recipient-email abuse protection the API can't get from the caller's
// IP alone (email OTP), since the browser never calls the API directly.
function getInternalKey(): string {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    throw new Error("INTERNAL_API_KEY is not configured");
  }
  return internalKey;
}

// Called only from the OAuth callback Route Handler after this server has
// already exchanged the code with Google directly and confirmed the profile.
export async function googleUpsertRequest(
  profile: GoogleProfile,
): Promise<{ user: WebUser; accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{
    user: WebUser;
    accessToken: string;
  }>("/web-users/auth/google/upsert", {
    method: "POST",
    body: JSON.stringify(profile),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
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

export async function requestEmailOtpRequest(email: string): Promise<void> {
  await apiFetch("/web-users/auth/email/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
    },
  });
}

export async function verifyEmailOtpRequest(
  email: string,
  code: string,
): Promise<{ user: WebUser; accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{
    user: WebUser;
    accessToken: string;
  }>("/web-users/auth/email/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
    },
  });

  const refreshToken = extractCookieValue(setCookies, "webUserRefreshToken");
  if (!refreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "OTP verify response did not include a refresh token",
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
