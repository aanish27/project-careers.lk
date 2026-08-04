import { SESSION_COOKIE_NAME } from "@dashboard-config/constants";
import { decryptSession } from "@dashboard-lib/session";
import { WEB_USER_SESSION_COOKIE_NAME } from "@web-app-config/constants";
import { jobsApi } from "@web-app-features/jobs/api/api";
import { decryptWebUserSession } from "@web-app-lib/web-user-session";
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

async function handleWebUserAuth(request: NextRequest) {
  const cookie = request.cookies.get(WEB_USER_SESSION_COOKIE_NAME)?.value;
  const session = cookie ? await decryptWebUserSession(cookie) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
