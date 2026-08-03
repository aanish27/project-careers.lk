import { randomBytes, createHash } from "node:crypto";
import "server-only";
import type { GoogleProfile } from "@web-app-lib/web-user-client";

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v3/userinfo";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

export function generateState(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function codeChallengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildGoogleAuthorizationUrl(
  state: string,
  codeChallenge: string,
): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_REDIRECT_URI are not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${GOOGLE_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

// Server-to-server exchange authenticated with the client secret — the
// returned access token is therefore trustworthy without any further
// verification (unlike a browser-supplied token, which would need JWKS
// verification if we were decoding an ID token directly instead).
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth env vars are not configured");
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status}`);
  }

  const body = (await res.json()) as GoogleTokenResponse;
  return body.access_token;
}

export async function fetchGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google userinfo request failed: ${res.status}`);
  }

  const body = (await res.json()) as GoogleUserInfoResponse;

  return {
    googleId: body.sub,
    email: body.email,
    emailVerified: body.email_verified,
    firstName: body.given_name ?? body.name?.split(" ")[0],
    lastName: body.family_name,
    avatarUrl: body.picture,
  };
}
