// Lowercase + trim so the same mailbox always maps to the same WebUser row
// regardless of how a provider echoes back casing (Google) or how a user
// types it (the OTP form) — Postgres's unique constraint on email is
// case-sensitive, so without this two casings of the same address would
// silently become two different accounts.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
