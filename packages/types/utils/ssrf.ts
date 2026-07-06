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

export async function assertNotSsrf(rawUrl: string): Promise<void> {
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  const { address } = await dns.lookup(hostname);

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(address))) {
    throw new Error(
      `SSRF blocked: ${rawUrl} resolves to private address ${address}`,
    );
  }
}
