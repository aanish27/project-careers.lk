import { PrismaClient } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import { ALL_CATEGORIES } from '@careerslk/types';
import { EXPLICIT_SKILLS, SRI_LANKAN_CITIES } from './data.ts';

export async function seedSeoLookups(prisma: PrismaClient) {
  const roles = await Promise.all(
    ALL_CATEGORIES.map((name) =>
      prisma.seoRole.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  const locations = await Promise.all(
    SRI_LANKAN_CITIES.map((name) =>
      prisma.seoLocation.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name), country: 'Sri Lanka' },
      }),
    ),
  );

  const existingSkills = await prisma.jobSkill.findMany({
    select: { name: true },
    distinct: ['name'],
  });
  const skillNames = [
    ...new Set([
      ...EXPLICIT_SKILLS,
      ...existingSkills.map((skill) => skill.name),
    ]),
  ];

  const skills = await Promise.all(
    skillNames.map((name) =>
      prisma.seoSkill.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  console.log(
    `  Seeded SEO lookups: ${roles.length} roles, ${locations.length} locations, ${skills.length} skills`,
  );

  return { roles, locations, skills };
}
