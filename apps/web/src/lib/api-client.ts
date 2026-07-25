import { PermissionKey } from "@careerslk/lib";
import "server-only";

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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; setCookies: string[] }> {
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the API server");
  }

  const body = (await res.json()) as ApiSuccessBody<T> | ApiErrorBody;

  if (body.success) {
    return { data: body.data, setCookies: res.headers.getSetCookie() };
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
