export const WEB_USER_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // mirrors the backend's JWT_WEB_USER_ACCESS_TOKEN_EXPIRES_IN
export const WEB_USER_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // mirrors the backend's JWT_WEB_USER_REFRESH_TOKEN_EXPIRES_IN
export const WEB_USER_REFRESH_THRESHOLD_MS = 60 * 1000;
export const WEB_USER_SESSION_COOKIE_NAME = "web_user_session";

// Short-lived cookies used only during the Google OAuth round trip.
export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "google_oauth_verifier";
export const GOOGLE_OAUTH_NEXT_COOKIE = "google_oauth_next";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE_S = 10 * 60;
