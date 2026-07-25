import { PermissionKey, SUPER_ADMIN_ROLE_SLUG } from '@careerslk/lib';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface PrincipalSnapshot {
  userId: number;
  email: string;
  isActive: boolean;
  roleSlugs: ReadonlySet<string>;
  permissions: ReadonlySet<PermissionKey>;
  isSuperAdmin: boolean;
}

type UserWithRoles = {
  id: number;
  email: string;
  isActive: boolean;
  roleAssignments: {
    role: {
      slug: string;
      permissionAssignments: { permission: { key: string } }[];
    };
  }[];
};

@Injectable()
export class PrincipalService {
  constructor(private readonly prisma: PrismaService) {}

  async load(userId: number): Promise<PrincipalSnapshot | null> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return this.toSnapshot(user);
  }

  toSnapshot(user: UserWithRoles): PrincipalSnapshot {
    const roleSlugs = new Set(
      user.roleAssignments.map((assignment) => assignment.role.slug),
    );

    const permissions = new Set<PermissionKey>();
    for (const assignment of user.roleAssignments) {
      for (const rolePermission of assignment.role.permissionAssignments) {
        permissions.add(rolePermission.permission.key as PermissionKey);
      }
    }

    return {
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
      roleSlugs,
      permissions,
      isSuperAdmin: roleSlugs.has(SUPER_ADMIN_ROLE_SLUG),
    };
  }
}
