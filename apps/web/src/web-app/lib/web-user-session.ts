import {
  WEB_USER_ACCESS_TOKEN_TTL_MS,
  WEB_USER_REFRESH_THRESHOLD_MS,
  WEB_USER_SESSION_COOKIE_NAME,
  WEB_USER_SESSION_MAX_AGE_MS,
} from "@web-app-config/constants";
import {
  type WebUser,
  webUserRefreshRequest,
} from "@web-app-lib/web-user-client";
import * as jose from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";

const encodedSecretKey = new TextEncoder().encode(
  process.env.WEB_USER_SESSION_SECRET,
);

interface WebUserSessionPayload extends jose.JWTPayload {
  user: WebUser;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
}

export const encryptWebUserSession = async (
  payload: WebUserSessionPayload,
): Promise<string> => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + WEB_USER_SESSION_MAX_AGE_MS))
    .sign(encodedSecretKey);
};

export const decryptWebUserSession = async (
  token: string,
): Promise<WebUserSessionPayload | null> => {
  try {
    const { payload } = await jose.jwtVerify<WebUserSessionPayload>(
      token,
      encodedSecretKey,
      { algorithms: ["HS256"] },
    );
    return payload;
  } catch {
    return null;
  }
};

export const createWebUserSession = async (
  payload: WebUserSessionPayload,
): Promise<void> => {
  const signed = await encryptWebUserSession(payload);
  (await cookies()).set(WEB_USER_SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEB_USER_SESSION_MAX_AGE_MS / 1000,
  });
};

export const updateWebUserSessionTokens = async (patch: {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
}): Promise<WebUserSessionPayload> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(WEB_USER_SESSION_COOKIE_NAME);
  const session = cookie ? await decryptWebUserSession(cookie.value) : null;
  if (!session) {
    throw new Error("No active session to update");
  }

  const updated: WebUserSessionPayload = {
    ...session,
    accessToken: patch.accessToken,
    accessTokenExpiresAt: patch.accessTokenExpiresAt,
    refreshToken: patch.refreshToken,
  };

  const signed = await encryptWebUserSession(updated);
  cookieStore.set(WEB_USER_SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEB_USER_SESSION_MAX_AGE_MS / 1000,
  });

  return updated;
};

export const destroyWebUserSession = async (): Promise<void> => {
  (await cookies()).delete(WEB_USER_SESSION_COOKIE_NAME);
};

// Render-safe: reads and decrypts the cookie only, never writes it. Next.js
// only allows cookie mutations inside a Server Action or Route Handler, but
// this is called from plain Server Component renders (layouts/pages), so it
// must not attempt to refresh or clear the cookie itself. The returned
// `accessToken` may be stale/expired — that's fine for display purposes;
// callers that are about to hit the API must use `getValidWebUserAccessToken()`
// instead, from a context where a refresh can actually be persisted.
export const getWebUserSession = cache(
  async (): Promise<WebUserSessionPayload | null> => {
    const cookie = (await cookies()).get(WEB_USER_SESSION_COOKIE_NAME);
    if (!cookie) return null;
    return decryptWebUserSession(cookie.value);
  },
);

export const verifyWebUserSession = cache(
  async (): Promise<WebUserSessionPayload> => {
    const s = await getWebUserSession();
    if (!s) redirect("/login");
    return s;
  },
);

// Only call from a Server Action or Route Handler (never from a layout/page
// render) — this may refresh and persist a new cookie, which Next.js only
// permits in those contexts. Returns null if there's no session or the
// refresh token itself is dead (and clears the cookie in that case).
export const getValidWebUserAccessToken = async (): Promise<string | null> => {
  const session = await getWebUserSession();
  if (!session) return null;

  if (
    session.accessTokenExpiresAt >
    Date.now() + WEB_USER_REFRESH_THRESHOLD_MS
  ) {
    return session.accessToken;
  }

  try {
    const { accessToken, refreshToken } = await webUserRefreshRequest(
      session.refreshToken,
    );
    const updated = await updateWebUserSessionTokens({
      accessToken,
      accessTokenExpiresAt: Date.now() + WEB_USER_ACCESS_TOKEN_TTL_MS,
      refreshToken,
    });
    return updated.accessToken;
  } catch {
    await destroyWebUserSession();
    return null;
  }
};
