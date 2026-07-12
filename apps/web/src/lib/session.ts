import { UserRole } from '@careerslk/types';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import 'server-only';
import { type AuthUser, refreshRequest } from './api-client';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_THRESHOLD_MS,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from './constants';

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
    .setProtectedHeader({ alg: 'HS256' })
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
      { algorithms: ['HS256'] },
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
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
    throw new Error('No active session to update');
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });

  return updated;
};

export const destroySession = async (): Promise<void> => {
  (await cookies()).delete(SESSION_COOKIE_NAME);
};

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME);
  if (!cookie) return null;

  const session = await decryptSession(cookie.value);
  if (!session) return null;

  if (session.accessTokenExpiresAt > Date.now() + REFRESH_THRESHOLD_MS) {
    return session;
  }

  try {
    const { accessToken, refreshToken } = await refreshRequest(
      session.refreshToken,
    );
    return await updateSessionTokens({
      accessToken,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
      refreshToken,
    });
  } catch {
    await destroySession();
    return null;
  }
});

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const s = await getSession();
  if (!s) redirect('/admin/login');
  return s;
});

export const requireRole = async (
  allowedRoles: UserRole[],
): Promise<SessionPayload> => {
  const session = await verifySession();
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/admin/login');
  }
  return session;
};
