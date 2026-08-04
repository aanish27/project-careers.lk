export const FREELANCE_CATEGORY_TAXONOMY = {
  'Development & IT': [
    'Web Development',
    'Mobile App Development',
    'DevOps',
    'QA & Testing',
  ],
  'Design & Creative': [
    'UI/UX Design',
    'Graphic Design',
    'Video Editing',
    'Illustration',
  ],
  'Sales & Marketing': [
    'Digital Marketing',
    'Social Media Marketing',
    'SEO',
    'Copywriting',
  ],
  'Writing & Translation': [
    'Content Writing',
    'Translation',
    'Proofreading & Editing',
  ],
  'Admin & Support': ['Data Entry', 'Virtual Assistance', 'Customer Support'],
  'Finance & Accounting': [
    'Bookkeeping',
    'Financial Analysis',
    'Tax Preparation',
  ],
  Legal: ['Contract Review', 'Legal Research'],
  'Engineering & Architecture': [
    'CAD & Drafting',
    'Structural Engineering',
    'Architecture',
  ],
} as const;

export type FreelanceCategory = keyof typeof FREELANCE_CATEGORY_TAXONOMY;

export const FREELANCE_CATEGORIES = Object.keys(
  FREELANCE_CATEGORY_TAXONOMY,
) as FreelanceCategory[];

export function getSkillsForFreelanceCategory(
  category: string | undefined,
): readonly string[] {
  if (!category || !(category in FREELANCE_CATEGORY_TAXONOMY)) return [];
  return FREELANCE_CATEGORY_TAXONOMY[category as FreelanceCategory];
}
