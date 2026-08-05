import { PrismaClient } from '@careerslk/database';
import { faker } from '@faker-js/faker';

export async function seedWebUsers(prisma: PrismaClient, count: number) {
  console.log(`Seeding ${count} web users...`);

  const usedEmails = new Set<string>();
  const webUsers = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    let email: string;
    do {
      email = faker.internet
        .email({ firstName, lastName, provider: 'example.com' })
        .toLowerCase();
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const webUser = await prisma.webUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName,
        lastName,
        avatarUrl: faker.datatype.boolean({ probability: 0.6 })
          ? `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`
          : null,
        isActive: true,
        lastLoginAt: faker.date.recent({ days: 30 }),
      },
    });

    webUsers.push(webUser);
  }

  console.log(`  Seeded ${webUsers.length} web users`);
  return webUsers;
}
