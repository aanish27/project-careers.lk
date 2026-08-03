/**
 * Best-effort canonicalization of free-text scraped location strings, so
 * they can be matched (case-insensitively) against SeoLocation.name. Not a
 * lookup against the known city list — unmatched values are simply left
 * unresolved by the caller rather than fuzzy-matched.
 */
export function normalizeLocationName(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/,?\s*sri lanka$/i, '').trim();
  value = value.replace(/\s*\(?\b\d{1,2}\)?\s*$/, '').trim();

  return value || null;
}

const SKILL_ALIASES: Record<string, string> = {
  reactjs: 'React',
  'react.js': 'React',
  nodejs: 'Node.js',
  node: 'Node.js',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  golang: 'Go',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
};

/**
 * Best-effort canonicalization of free-text scraped skill names, so they
 * can be matched (case-insensitively) against SeoSkill.name. Only handles a
 * small set of common variants — unmatched values are left unresolved.
 */
export function normalizeSkillName(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const key = trimmed.toLowerCase().replace(/[.\s]+/g, '');
  return SKILL_ALIASES[key] ?? trimmed;
}
