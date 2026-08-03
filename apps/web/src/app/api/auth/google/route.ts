import {
  GOOGLE_OAUTH_COOKIE_MAX_AGE_S,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "@web-app-config/constants";
import {
  buildGoogleAuthorizationUrl,
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generateState,
} from "@web-app-lib/google-oauth";
import { isSafeRedirectPath } from "@utils/utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next =
    requestedNext && isSafeRedirectPath(requestedNext)
      ? requestedNext
      : "/profile";

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);

  const response = NextResponse.redirect(
    buildGoogleAuthorizationUrl(state, codeChallenge),
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_S,
  };

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(
    GOOGLE_OAUTH_VERIFIER_COOKIE,
    codeVerifier,
    cookieOptions,
  );
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, next, cookieOptions);

  return response;
}
