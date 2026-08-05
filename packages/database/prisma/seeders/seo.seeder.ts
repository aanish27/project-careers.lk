import { LocationLevel, PrismaClient } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import { ALL_CATEGORIES, LOCATION_TAXONOMY, PROVINCES } from '@careerslk/types';
import { EXPLICIT_SKILLS } from './data.ts';

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

  // Province -> district -> city, seeded in that order since each level's
  // row needs its parent's id already assigned — can't be a Promise.all.
  const locations = [];
  for (const province of PROVINCES) {
    const provinceData = LOCATION_TAXONOMY[province];
    const provinceRow = await prisma.seoLocation.upsert({
      where: { slug: provinceData.slug },
      update: { level: LocationLevel.PROVINCE, parentId: null },
      create: {
        name: province,
        slug: provinceData.slug,
        country: 'Sri Lanka',
        level: LocationLevel.PROVINCE,
      },
    });
    locations.push(provinceRow);

    for (const [district, districtData] of Object.entries(
      provinceData.districts,
    )) {
      const districtRow = await prisma.seoLocation.upsert({
        where: { slug: districtData.slug },
        update: { level: LocationLevel.DISTRICT, parentId: provinceRow.id },
        create: {
          name: district,
          slug: districtData.slug,
          country: 'Sri Lanka',
          level: LocationLevel.DISTRICT,
          parentId: provinceRow.id,
        },
      });
      locations.push(districtRow);

      for (const [city, citySlug] of Object.entries(districtData.cities)) {
        const cityRow = await prisma.seoLocation.upsert({
          where: { slug: citySlug },
          update: { level: LocationLevel.CITY, parentId: districtRow.id },
          create: {
            name: city,
            slug: citySlug,
            country: 'Sri Lanka',
            level: LocationLevel.CITY,
            parentId: districtRow.id,
          },
        });
        locations.push(cityRow);
      }
    }
  }

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
