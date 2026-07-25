import { PrismaClient, SeoPageType } from '@careerslk/database';
import { faker } from '@faker-js/faker';
import { ROLE_CATEGORIES, SRI_LANKAN_CITIES } from './data.ts';

const SLUGIFY = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function seedSeoLookups(prisma: PrismaClient) {
  const roles = await Promise.all(
    ROLE_CATEGORIES.map((name) =>
      prisma.seoRole.upsert({
        where: { slug: SLUGIFY(name) },
        update: {},
        create: { name, slug: SLUGIFY(name) },
      }),
    ),
  );

  const locations = await Promise.all(
    SRI_LANKAN_CITIES.map((name) =>
      prisma.seoLocation.upsert({
        where: { slug: SLUGIFY(name) },
        update: {},
        create: { name, slug: SLUGIFY(name), country: 'Sri Lanka' },
      }),
    ),
  );

  const skills = await Promise.all(
    ['React', 'Node.js', 'Python', 'SEO', 'Salesforce', 'AWS'].map((name) =>
      prisma.seoSkill.upsert({
        where: { slug: SLUGIFY(name) },
        update: {},
        create: { name, slug: SLUGIFY(name) },
      }),
    ),
  );

  return { roles, locations, skills };
}

export async function seedSeoPages(prisma: PrismaClient) {
  const existing = await prisma.seoPage.count();
  if (existing > 0) {
    console.log('SEO pages already seeded, skipping');
    return;
  }

  console.log('Seeding SEO pages...');

  const { roles, locations } = await seedSeoLookups(prisma);

  let count = 0;
  for (const role of roles) {
    const slug = `${SLUGIFY(role.name)}-jobs`;
    await prisma.seoPage.upsert({
      where: { slug },
      update: {},
      create: {
        pageType: SeoPageType.ROLE,
        slug,
        roleId: String(role.id),
        title: `${role.name} Jobs in Sri Lanka`,
        metaDescription: `Browse the latest ${role.name} job openings in Sri Lanka. Updated daily.`,
        h1: `${role.name} Jobs`,
        introText: faker.lorem.paragraph(),
        bottomText: faker.lorem.paragraph(),
        canonicalUrl: `https://careers.lk/jobs/${slug}`,
        relatedLinksJson: locations
          .slice(0, 5)
          .map((location) => `${SLUGIFY(role.name)}-jobs-in-${location.slug}`),
        isIndexable: true,
        lastGeneratedAt: faker.date.recent({ days: 14 }),
        lastmod: faker.date.recent({ days: 7 }),
      },
    });
    count++;
  }

  for (const location of locations.slice(0, 6)) {
    const slug = `jobs-in-${location.slug}`;
    await prisma.seoPage.upsert({
      where: { slug },
      update: {},
      create: {
        pageType: SeoPageType.LOCATION,
        slug,
        locationId: String(location.id),
        title: `Jobs in ${location.name}, Sri Lanka`,
        metaDescription: `Find the latest job vacancies in ${location.name}. New listings added daily.`,
        h1: `Jobs in ${location.name}`,
        introText: faker.lorem.paragraph(),
        bottomText: faker.lorem.paragraph(),
        canonicalUrl: `https://careers.lk/jobs/${slug}`,
        relatedLinksJson: roles
          .slice(0, 5)
          .map((role) => `${SLUGIFY(role.name)}-jobs-in-${location.slug}`),
        isIndexable: true,
        lastGeneratedAt: faker.date.recent({ days: 14 }),
        lastmod: faker.date.recent({ days: 7 }),
      },
    });
    count++;
  }

  console.log(`  Seeded ${count} SEO pages`);
}
