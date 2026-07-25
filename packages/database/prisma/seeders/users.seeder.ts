import { PrismaClient, UserRole } from '@careerslk/database';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

async function seedUser(prisma: PrismaClient, user: SeedUser) {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

  const created = await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      email: user.email,
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });

  console.log(
    `  Seeded ${created.role} user: ${created.email} (id: ${created.id})`,
  );
}

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');

  await seedUser(prisma, {
    email: 'superadmin@careers.lk',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: UserRole.SUPER_ADMIN,
  });

  await seedUser(prisma, {
    email: 'admin@careers.lk',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  });
}
