import { PermissionKey, SUPER_ADMIN_ROLE_SLUG } from '@careerslk/types';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';

type RoleMutabilityCheck = { isSystem: boolean; slug: string };

@Injectable()
export class RbacPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  assertNotSelf(actor: AuthenticatedPrincipal, targetUserId: number): void {
    if (actor.userId === targetUserId) {
      throw new ForbiddenException(
        'You cannot modify your own roles or account status. ' +
          'Ask another administrator to make this change.',
      );
    }
  }

  assertCanGrantPermissions(
    actor: AuthenticatedPrincipal,
    permissionKeys: PermissionKey[],
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    const notHeld = permissionKeys.filter((key) => !actor.permissions.has(key));

    if (notHeld.length > 0) {
      throw new ForbiddenException(
        'You cannot grant permissions you do not hold yourself: ' +
          notHeld.join(', '),
      );
    }
  }

  assertRoleIsMutable(role: RoleMutabilityCheck): void {
    if (role.isSystem) {
      throw new ForbiddenException(
        `The '${role.slug}' role is a system role and cannot be modified or deleted.`,
      );
    }
  }

  async assertCanAssignRoles(
    actor: AuthenticatedPrincipal,
    roleIds: number[],
  ): Promise<void> {
    if (actor.isSuperAdmin || roleIds.length === 0) {
      return;
    }

    const privileged = await this.prisma.role.count({
      where: { id: { in: roleIds }, slug: SUPER_ADMIN_ROLE_SLUG },
    });

    if (privileged > 0) {
      throw new ForbiddenException(
        'Only a super admin can assign the super admin role.',
      );
    }
  }

  async assertNotLastSuperAdmin(targetUserId: number): Promise<void> {
    const isSuperAdmin = await this.prisma.roleAssignment.count({
      where: { userId: targetUserId, role: { slug: SUPER_ADMIN_ROLE_SLUG } },
    });

    if (isSuperAdmin === 0) {
      return;
    }

    const remaining = await this.prisma.roleAssignment.count({
      where: {
        role: { slug: SUPER_ADMIN_ROLE_SLUG },
        userId: { not: targetUserId },
        user: { isActive: true },
      },
    });

    if (remaining === 0) {
      throw new ForbiddenException(
        'This is the last active super admin. Promote another user first.',
      );
    }
  }
}
