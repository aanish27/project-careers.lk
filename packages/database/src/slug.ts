/**
 * Finds a slug that doesn't collide, appending -2, -3, ... to `base` until
 * `exists` reports false. Used for Company.slug, which (unlike Job.slug) has
 * no naturally-unique suffix to fall back on.
 */
export async function generateUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  let attempt = 2;

  while (await exists(candidate)) {
    candidate = `${base}-${attempt++}`;
  }

  return candidate;
}
