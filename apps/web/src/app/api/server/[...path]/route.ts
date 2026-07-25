import { getValidAccessToken } from "@dashboard-lib/session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Not authenticated" },
      },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const upstreamUrl = `${process.env.API_URL}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
    });

    const body = await upstreamResponse.text();
    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BFF_PROXY_ERROR",
          message: "Unable to reach the API server",
        },
      },
      { status: 502 },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
