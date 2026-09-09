import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  WEB_USER_ACCESS_TOKEN_TTL_MS,
} from "@web-app-config/constants";
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
} from "@web-app-lib/google-oauth";
import { createWebUserSession } from "@web-app-lib/web-user-session";
import { googleUpsertRequest } from "@web-app-lib/web-user-client";
import { isSafeRedirectPath } from "@utils/utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// These were set with path "/api/auth/google" (see the initiate route) —
// deleting a cookie requires matching that same path, or the browser won't
// recognize it as the same cookie and it'll linger.
function clearGoogleOauthCookies(response: NextResponse): void {
  const path = "/api/auth/google";
  response.cookies.delete({ name: GOOGLE_OAUTH_STATE_COOKIE, path });
  response.cookies.delete({ name: GOOGLE_OAUTH_VERIFIER_COOKIE, path });
  response.cookies.delete({ name: GOOGLE_OAUTH_NEXT_COOKIE, path });
}

function loginFailedRedirect(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL("/login?error=oauth_failed", request.url),
  );
  clearGoogleOauthCookies(response);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");

  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;
  const storedNext = request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value;

  // CSRF check: the state Google echoes back must match what we stashed
  // before redirecting there. Reject on any mismatch or missing piece.
  if (
    !code ||
    !returnedState ||
    !storedState ||
    !codeVerifier ||
    returnedState !== storedState
  ) {
    return loginFailedRedirect(request);
  }

  let accessToken: string;
  try {
    accessToken = await exchangeGoogleCode(code, codeVerifier);
  } catch {
    return loginFailedRedirect(request);
  }

  const profile = await fetchGoogleProfile(accessToken);

  const {
    user,
    accessToken: appAccessToken,
    refreshToken,
  } = await googleUpsertRequest(profile);

  await createWebUserSession({
    user,
    accessToken: appAccessToken,
    accessTokenExpiresAt: Date.now() + WEB_USER_ACCESS_TOKEN_TTL_MS,
    refreshToken,
  });

  // Re-validate `next` here rather than trusting the round-tripped cookie
  // value implicitly — it started as attacker-influenceable query input.
  const next =
    storedNext && isSafeRedirectPath(storedNext) ? storedNext : "/account";

  const response = NextResponse.redirect(new URL(next, request.url));
  clearGoogleOauthCookies(response);
  return response;
}
