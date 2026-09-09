import { RATE_LIMIT_MESSAGE } from "@lib/messages";
import { ApiError } from "../lib/api-error";

// A 429 from @nestjs/throttler carries its raw internal exception-class
// string ("ThrottlerException: Too Many Requests") as `message` — not
// something to hand to toast.error, so it's swapped for friendly text here.
export const toMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) return fallback;
  return error.status === 429 ? RATE_LIMIT_MESSAGE : error.message;
};
