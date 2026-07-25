import type { PermissionKey } from "@careerslk/lib";
import { can, canAny } from "@dashboard-utils/permissions";
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_THRESHOLD_MS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "@dashboard-config/constants";
import { type AuthUser, refreshRequest } from "@lib/api-client";
import * as jose from "jose";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import "server-only";

const encodedSecretKey = new TextEncoder().encode(process.env.SESSION_SECRET);

interface SessionPayload extends jose.JWTPayload {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
}

export const encryptSession = async (
  payload: SessionPayload,
): Promise<string> => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_MAX_AGE_MS))
    .sign(encodedSecretKey);
};

export const decryptSession = async (
  token: string,
): Promise<SessionPayload | null> => {
  try {
    const { payload } = await jose.jwtVerify<SessionPayload>(
      token,
      encodedSecretKey,
      { algorithms: ["HS256"] },
    );
    return payload;
  } catch {
    return null;
  }
};

export const createSession = async (payload: SessionPayload): Promise<void> => {
  const signed = await encryptSession(payload);
  (await cookies()).set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
};

export const updateSessionTokens = async (patch: {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
}): Promise<SessionPayload> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  const session = cookie ? await decryptSession(cookie.value) : null;
  if (!session) {
    throw new Error("No active session to update");
  }

  const updated: SessionPayload = {
    ...session,
    accessToken: patch.accessToken,
    accessTokenExpiresAt: patch.accessTokenExpiresAt,
    refreshToken: patch.refreshToken,
  };

  const signed = await encryptSession(updated);
  cookieStore.set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return updated;
};

export const destroySession = async (): Promise<void> => {
  (await cookies()).delete(SESSION_COOKIE_NAME);
};

// Render-safe: reads and decrypts the cookie only, never writes it. Next.js
// only allows cookie mutations inside a Server Action or Route Handler, but
// this is called from plain Server Component renders (layouts/pages), so it
// must not attempt to refresh or clear the cookie itself. The returned
// `accessToken` may be stale/expired — that's fine for display purposes;
// callers that are about to hit the API must use `getValidAccessToken()`
// instead, from a context where a refresh can actually be persisted.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME);
  if (!cookie) return null;
  return decryptSession(cookie.value);
});

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
});

// Only call from a Server Action or Route Handler (never from a layout/page
// render) — this may refresh and persist a new cookie, which Next.js only
// permits in those contexts. Returns null if there's no session or the
// refresh token itself is dead (and clears the cookie in that case).
export const getValidAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  if (!session) return null;

  if (session.accessTokenExpiresAt > Date.now() + REFRESH_THRESHOLD_MS) {
    return session.accessToken;
  }

  try {
    const { accessToken, refreshToken } = await refreshRequest(
      session.refreshToken,
    );
    const updated = await updateSessionTokens({
      accessToken,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
      refreshToken,
    });
    return updated.accessToken;
  } catch {
    await destroySession();
    return null;
  }
};

// Unlike verifySession() (no session at all -> redirect to login), a missing
// PERMISSION on an otherwise-valid session renders 404, not a redirect. This
// is deliberate: redirecting (to login, or back to the dashboard) confirms to
// the caller that the route exists but is off-limits. A 404 gives no signal
// either way about whether the URL is real, which matters for someone
// guessing/enumerating admin routes they don't hold a role for.
export const requirePermission = async (
  permission: PermissionKey,
): Promise<SessionPayload> => {
  const session = await verifySession();
  if (!can(session.user, permission)) {
    notFound();
  }
  return session;
};

export const requireAnyPermission = async (
  permissions: PermissionKey[],
): Promise<SessionPayload> => {
  const session = await verifySession();
  if (!canAny(session.user, permissions)) {
    notFound();
  }
  return session;
};
