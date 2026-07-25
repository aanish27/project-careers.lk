import { InvoiceStatus, PackageType, PrismaClient } from '@careerslk/database';
import { faker } from '@faker-js/faker';

export async function seedAdvertisers(prisma: PrismaClient, count: number) {
  const existing = await prisma.advertiser.count();
  if (existing > 0) {
    console.log('Advertisers already seeded, skipping');
    return;
  }

  console.log(`Seeding ${count} advertisers...`);

  for (let i = 0; i < count; i++) {
    const startDate = faker.date.recent({ days: 30 });
    const endDate = faker.date.soon({ days: 60, refDate: startDate });
    const packageType = faker.helpers.arrayElement([
      PackageType.ADSENSE,
      PackageType.MODAL,
      PackageType.SPONSORED_CARD,
    ]);

    await prisma.advertiser.create({
      data: {
        name: faker.company.name(),
        contactEmail: faker.internet.email().toLowerCase(),
        packageType,
        slotPosition:
          packageType === PackageType.SPONSORED_CARD
            ? faker.number.int({ min: 1, max: 5 })
            : null,
        creativeUrl: faker.image.urlPicsumPhotos({ width: 728, height: 90 }),
        headline: faker.company.catchPhrase(),
        description: faker.lorem.sentence(),
        ctaText: faker.helpers.arrayElement([
          'Apply Now',
          'Learn More',
          'View Openings',
          'Get Started',
        ]),
        destinationUrl: faker.internet.url(),
        startDate,
        endDate,
        invoiceStatus: faker.helpers.weightedArrayElement([
          { value: InvoiceStatus.PAID, weight: 4 },
          { value: InvoiceStatus.SENT, weight: 2 },
          { value: InvoiceStatus.PENDING, weight: 2 },
          { value: InvoiceStatus.OVERDUE, weight: 1 },
        ]),
        isActive: endDate > new Date(),
      },
    });
  }

  console.log(`  Seeded ${count} advertisers`);
}
