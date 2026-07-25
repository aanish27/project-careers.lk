import { SUPER_ADMIN_ROLE_SLUG } from '@careerslk/types';
import { PrismaClient } from '@careerslk/database';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function seedSuperAdmin(
  prisma: PrismaClient,
  options: { email?: string; password?: string },
) {
  console.log('Seeding super admin role...');

  let role = await prisma.role.findUnique({
    where: { slug: SUPER_ADMIN_ROLE_SLUG },
    include: { permissionAssignments: true },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        slug: SUPER_ADMIN_ROLE_SLUG,
        name: 'Super Admin',
        description:
          'Unrestricted access. Bypasses permission checks entirely and cannot be modified through the API.',
        isSystem: true,
      },
      include: { permissionAssignments: true },
    });
    console.log('  Created super_admin role');
  }

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });
  const held = new Set(role.permissionAssignments.map((a) => a.permissionId));
  const missing = allPermissions.filter((p) => !held.has(p.id));

  if (missing.length > 0) {
    await prisma.rolePermission.createMany({
      data: missing.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    console.log(`  Granted ${missing.length} permission(s) to super_admin`);
  }

  const existingSuperAdminCount = await prisma.roleAssignment.count({
    where: { roleId: role.id },
  });

  if (existingSuperAdminCount > 0) {
    console.log('  Super admin user already exists, skipping bootstrap user');
    return;
  }

  if (!options.email || !options.password) {
    throw new Error(
      'No super admin exists and SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD are not set. ' +
        'Set both and re-run.',
    );
  }

  const hashedPassword = await bcrypt.hash(options.password, SALT_ROUNDS);

  const user = await prisma.adminUser.create({
    data: {
      email: options.email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      roleAssignments: { create: [{ roleId: role.id }] },
    },
  });

  console.log(`  Seeded bootstrap super admin: ${user.email} (id: ${user.id})`);
}
