import { ApiFetchOptions } from "@/types";
import { getValidWebUserAccessToken } from "@/web-app/lib/web-user-session";
import { PermissionKey } from "@careerslk/lib";
import "server-only";
import { RATE_LIMIT_MESSAGE } from "@lib/messages";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: PermissionKey[];
  isSuperAdmin: boolean;
}

interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Server Actions call this in their catch blocks instead of reading
// `err.message` directly. A 429 from `@nestjs/throttler`'s ThrottlerGuard
// carries the raw internal exception-class string ("ThrottlerException: Too
// Many Requests") as its message — that's an implementation detail, not
// something to show a user, so it's swapped for a friendly one here. Any
// other status keeps its message as-is (e.g. the web-user OTP endpoints
// already throw hand-written, user-facing 429 text of their own).
export function toActionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.status === 429 ? RATE_LIMIT_MESSAGE : err.message;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchOptions,
): Promise<{ data: T; setCookies: string[] }> {
  let accessToken: string | null = null;

  const { auth, ...requestInit } = init ?? {};

  if (auth) {
    accessToken = await getValidWebUserAccessToken();

    if (!accessToken) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }
  }

  let res: Response;

  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      ...requestInit,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...requestInit.headers,
      },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the API server");
  }

  const body = (await res.json()) as ApiSuccessBody<T> | ApiErrorBody;

  if (body.success) {
    return {
      data: body.data,
      setCookies: res.headers.getSetCookie(),
    };
  }

  throw new ApiError(
    res.status,
    body.error.code,
    body.error.message,
    body.error.details,
  );
}
export function extractCookieValue(
  setCookies: string[],
  name: string,
): string | undefined {
  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(";");
    const [key, value] = pair.split("=");
    if (key === name) return value;
  }
  return undefined;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{
    user: AuthUser;
    accessToken: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const refreshToken = extractCookieValue(setCookies, "refreshToken");
  if (!refreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Login response did not include a refresh token",
    );
  }

  return { user: data.user, accessToken: data.accessToken, refreshToken };
}

export async function logoutRequest(accessToken: string): Promise<void> {
  await apiFetch("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const { data } = await apiFetch<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function refreshRequest(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{ accessToken: string }>(
    "/auth/refresh",
    { method: "POST", headers: { Cookie: `refreshToken=${refreshToken}` } },
  );

  const rotatedRefreshToken = extractCookieValue(setCookies, "refreshToken");
  if (!rotatedRefreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Refresh response did not include a rotated refresh token",
    );
  }

  return { accessToken: data.accessToken, refreshToken: rotatedRefreshToken };
}
