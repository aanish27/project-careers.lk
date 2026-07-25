import { CompanyStatus, PrismaClient, ScrapeStatus } from '@careerslk/database';
import { faker } from '@faker-js/faker';
import { ATS_PLATFORMS, COMPANY_NAME_PARTS } from './data.ts';

function buildCompanyName(usedNames: Set<string>): string {
  let name: string;
  do {
    name = faker.datatype.boolean({ probability: 0.4 })
      ? faker.company.name()
      : `${faker.helpers.arrayElement(COMPANY_NAME_PARTS.prefixes)} ${faker.helpers.arrayElement(COMPANY_NAME_PARTS.suffixes)}`;
  } while (usedNames.has(name));

  usedNames.add(name);
  return name;
}

export async function seedCompanies(prisma: PrismaClient, count: number) {
  console.log(`Seeding ${count} companies...`);

  const usedNames = new Set<string>();
  const companies = [];

  for (let i = 0; i < count; i++) {
    const name = buildCompanyName(usedNames);
    const domain = faker.internet.domainName();
    const websiteUrl = `https://${domain}`;
    const status = faker.helpers.weightedArrayElement([
      { value: CompanyStatus.ACTIVE, weight: 8 },
      { value: CompanyStatus.INACTIVE, weight: 2 },
    ]);
    const scrapeStatus = faker.helpers.weightedArrayElement([
      { value: ScrapeStatus.ACTIVE, weight: 6 },
      { value: ScrapeStatus.EMPTY, weight: 2 },
      { value: ScrapeStatus.ERROR, weight: 1 },
      { value: ScrapeStatus.CHECK, weight: 1 },
      { value: ScrapeStatus.SKIPPED, weight: 1 },
    ]);
    const hasSelector = scrapeStatus === ScrapeStatus.ACTIVE;

    const company = await prisma.company.upsert({
      where: { websiteUrl },
      update: {},
      create: {
        name,
        logoUrl: faker.datatype.boolean({ probability: 0.7 })
          ? `https://logo.clearbit.com/${domain}`
          : null,
        websiteUrl,
        careerUrl: `${websiteUrl}/careers`,
        atsPlatform: faker.helpers.arrayElement(ATS_PLATFORMS),
        status,
        scrapeStatus,
        pageHash: hasSelector ? faker.string.alphanumeric(32) : null,
        lastScrapedAt: hasSelector ? faker.date.recent({ days: 14 }) : null,
        htmlSelector: hasSelector
          ? faker.helpers.arrayElement([
              '.job-listing',
              '#job-cards-container',
              '.careers-list li',
              '#job-table',
            ])
          : null,
        htmlSelectorType: hasSelector
          ? faker.helpers.arrayElement(['class', 'id'])
          : null,
        htmlSelectorReason: hasSelector
          ? 'Element uniquely wraps all job listings on the careers page.'
          : null,
        htmlSelectorConfidence: hasSelector
          ? faker.helpers.arrayElement(['high', 'medium', 'low'])
          : null,
        paginationType: hasSelector
          ? faker.helpers.arrayElement([
              'infinite_scrolling',
              'load_more_button',
              'next_button',
              'pagination_numbers',
            ])
          : null,
        paginationBtn: hasSelector ? '.pagination-next' : null,
        paginationReason: hasSelector
          ? 'Numbered page links detected in the container.'
          : null,
      },
    });

    companies.push(company);
  }

  console.log(`  Seeded ${companies.length} companies`);
  return companies;
}
