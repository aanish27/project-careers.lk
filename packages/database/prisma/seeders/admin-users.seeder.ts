import { PrismaClient } from '@careerslk/database';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function seedAdminUsers(prisma: PrismaClient) {
  console.log('Seeding demo admin role and user...');

  const demoPermissions = await prisma.permission.findMany({
    where: { key: { in: ['users.read', 'roles.read', 'permissions.read'] } },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      slug: 'admin',
      name: 'Admin',
      description: 'Day-to-day dashboard access for local development.',
      isSystem: false,
      permissionAssignments: {
        create: demoPermissions.map((permission) => ({
          permissionId: permission.id,
        })),
      },
    },
  });

  const hashedPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);

  const user = await prisma.adminUser.upsert({
    where: { email: 'admin@careers.lk' },
    update: {},
    create: {
      email: 'admin@careers.lk',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleAssignments: { create: [{ roleId: adminRole.id }] },
    },
  });

  console.log(`  Seeded admin user: ${user.email} (id: ${user.id})`);
}
