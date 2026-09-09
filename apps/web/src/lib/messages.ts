// No "server-only" guard here deliberately — both Server Actions (to set
// this as the error text) and Client Components (to recognize it and show a
// toast instead of raw inline text) need to import it.
export const RATE_LIMIT_MESSAGE =
  "You're doing that too much. Please wait a moment and try again.";

// A rate limit gets its own toast (see useRateLimitToast) rather than
// sitting inline next to a field — it isn't something wrong with what the
// user typed. Use this when rendering an action's `error` inline so it
// doesn't show twice.
export function dismissRateLimited(
  error: string | undefined,
): string | undefined {
  return error === RATE_LIMIT_MESSAGE ? undefined : error;
}
