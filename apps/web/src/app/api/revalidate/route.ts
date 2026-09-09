import * as crypto from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Same shared-secret pattern as apps/api's InternalOnlyGuard, just in the
// reverse direction: apps/api calls this to invalidate the pSEO job-listing
// cache whenever a job's public visibility changes (create/edit/withdraw/
// approve/reject/delete/expire).
function isAuthorized(request: NextRequest): boolean {
  const provided = request.headers.get("x-internal-key");
  const expected = process.env.INTERNAL_API_KEY;
  if (!provided || !expected) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid internal key" },
      },
      { status: 401 },
    );
  }

  let body: { tags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
      },
      { status: 400 },
    );
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];
  if (tags.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "`tags` must be a non-empty string array",
        },
      },
      { status: 400 },
    );
  }

  // { expire: 0 }, not 'max' — this is exactly the "webhook needs immediate
  // expiration" case Next's own docs call out; 'max' would only mark the
  // tag stale for the next visitor's background revalidation, leaving a
  // just-changed job invisible until someone else happens to hit the page.
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ success: true, data: { revalidated: tags } });
}
