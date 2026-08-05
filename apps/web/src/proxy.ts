import { SESSION_COOKIE_NAME } from "@dashboard-config/constants";
import { decryptSession } from "@dashboard-lib/session";
import {
  WEB_USER_ACCESS_TOKEN_TTL_MS,
  WEB_USER_REFRESH_THRESHOLD_MS,
  WEB_USER_SESSION_COOKIE_NAME,
  WEB_USER_SESSION_MAX_AGE_MS,
} from "@web-app-config/constants";
import { jobsApi } from "@web-app-features/jobs/api/api";
import {
  decryptWebUserSession,
  encryptWebUserSession,
} from "@web-app-lib/web-user-session";
import { webUserRefreshRequest } from "@web-app-lib/web-user-client";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// FR-SEO-10: retired pages (job or pSEO) must return a real HTTP 410, not a
// 404 or a rendered "noindex" page — Next's `notFound()` from a page
// component can only ever produce a 404, so this has to happen here,
// before the page renders.
const JOB_SLUG_PATTERN = /-(\d+)$/;

async function handleAdminAuth(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = cookie ? await decryptSession(cookie) : null;
  const isLoginPath = request.nextUrl.pathname === "/admin/login";

  if (!session && !isLoginPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLoginPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

async function handleWebUserAuth(request: NextRequest) {
  const cookie = request.cookies.get(WEB_USER_SESSION_COOKIE_NAME)?.value;
  const session = cookie ? await decryptWebUserSession(cookie) : null;

  if (!session) {
    return redirectToLogin(request);
  }

  // The access token is short-lived (15m) and pages that fetch data
  // directly in a Server Component render can't refresh it themselves —
  // writing a cookie from a page render throws, so that's restricted to
  // Server Actions/Route Handlers. Proxy/middleware IS allowed to set
  // cookies, so it's the right place to refresh proactively before the
  // page ever sees a stale token. Only a dead *refresh* token (not just an
  // expired access token) should actually force a re-login.
  if (
    session.accessTokenExpiresAt >
    Date.now() + WEB_USER_REFRESH_THRESHOLD_MS
  ) {
    return NextResponse.next();
  }

  try {
    const { accessToken, refreshToken } = await webUserRefreshRequest(
      session.refreshToken,
    );
    const updatedSession = {
      ...session,
      accessToken,
      accessTokenExpiresAt: Date.now() + WEB_USER_ACCESS_TOKEN_TTL_MS,
      refreshToken,
    };
    const signed = await encryptWebUserSession(updatedSession);

    // Make the refreshed cookie visible to *this* request's page render
    // (not just future ones) — cookies are just a `Cookie` header, and
    // `request.cookies.set` mutates the same header object `request.headers`
    // reads from, per Next's documented request-header-forwarding pattern.
    request.cookies.set(WEB_USER_SESSION_COOKIE_NAME, signed);
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.set(WEB_USER_SESSION_COOKIE_NAME, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: WEB_USER_SESSION_MAX_AGE_MS / 1000,
    });
    return response;
  } catch {
    // Refresh token itself is dead/expired — genuinely logged out now.
    return redirectToLogin(request);
  }
}

async function handleRetirementCheck(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/+/, "");
  const segments = path.split("/");

  try {
    const isJobDetailPath =
      segments[0] === "jobs" &&
      segments.length === 2 &&
      JOB_SLUG_PATTERN.test(segments[1]);

    const retired = isJobDetailPath
      ? await jobsApi.isRetired(segments[1])
      : await seoPagesApi.isRetired(path);

    if (retired) {
      return new NextResponse(null, { status: 410 });
    }
  } catch {
    // Fail open — if the retirement check itself errors, let the request
    // through rather than blocking real traffic on a transient API issue.
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return handleAdminAuth(request);
  }
  if (
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/post-job") ||
    request.nextUrl.pathname.startsWith("/company")
  ) {
    return handleWebUserAuth(request);
  }
  return handleRetirementCheck(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/jobs/:path*",
    "/companies/:path*",
    "/internships",
    "/remote-jobs",
    "/profile/:path*",
    "/post-job/:path*",
    "/company/:path*",
  ],
};
