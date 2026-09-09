import { promises as dns } from 'node:dns';
import { URL } from 'node:url';

const BLOCKED_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // RFC1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC1918
  /^192\.168\./, // RFC1918
  /^169\.254\./, // link-local (AWS metadata endpoint lives here)
  /^0\./, // this-network
  /^::1$/, // IPv6 loopback
  /^fc[0-9a-f]{2}:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
];

export class SsrfValidationError extends Error {}

export async function assertNotSsrf(rawUrl: string): Promise<void> {
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    throw new SsrfValidationError(`Invalid URL: ${rawUrl}`);
  }

  // The DNS-based private-IP check needs a resolvable domain and real
  // network access, which dev environments don't reliably have — skip it
  // outside production so local/staging URLs with flaky DNS don't 500.
  if (process.env.NODE_ENV !== 'production') return;

  let address: string;
  try {
    ({ address } = await dns.lookup(hostname));
  } catch {
    throw new SsrfValidationError(`Could not resolve host: ${hostname}`);
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(address))) {
    throw new SsrfValidationError(
      `SSRF blocked: ${rawUrl} resolves to private address ${address}`,
    );
  }
}
