import { slugify } from "@careerslk/lib/slugify";
import { SECTORS } from "@careerslk/types";

export function resolveSectorFromSlug(slug: string): string | undefined {
  return SECTORS.find((sector) => slugify(sector) === slug);
}
