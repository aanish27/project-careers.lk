import { SUPER_ADMIN_ROLE_SLUG } from '@careerslk/lib';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import {
  IPrincipalCache,
  PRINCIPAL_CACHE,
} from '@/modules/rbac/principal-cache.service';
import { RbacPolicyService } from '@/modules/rbac/rbac-policy.service';
import { AdminUsersService } from './admin-users.service';
import {
  CreateUserDto,
  ResetPasswordDto,
  SetUserRolesDto,
  UpdateUserProfileDto,
} from './dto/admin-users.dto';

const withRoles = { roleAssignments: { include: { role: true } } } as const;
const SALT_ROUNDS = 10;

@Injectable()
export class AdminUserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: AdminUsersService,
    private readonly policy: RbacPolicyService,
    private readonly audit: AuditService,
    @Inject(PRINCIPAL_CACHE)
    private readonly principalCache: IPrincipalCache,
  ) {}

  private async resolveRoles(roleIds: number[]) {
    if (roleIds.length === 0) {
      return [];
    }

    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (found.length !== roleIds.length) {
      const foundIds = new Set(found.map((r) => r.id));
      const missing = roleIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Unknown role id(s): ${missing.join(', ')}`);
    }

    return found;
  }

  async create(
    actor: AuthenticatedPrincipal,
    dto: CreateUserDto,
    context: AuditContext,
  ) {
    const existing = await this.usersService.getUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const roleIds = dto.roleIds ?? [];
    await this.policy.assertCanAssignRoles(actor, roleIds);
    const roles = await this.resolveRoles(roleIds);

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          createdById: actor.userId,
          roleAssignments: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        include: withRoles,
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.USER_CREATED,
          entityType: 'admin_user',
          entityId: user.id,
          newValue: { email: user.email, roles: roles.map((r) => r.slug) },
        },
        tx,
      );

      return user;
    });
  }

  async updateProfile(
    actor: AuthenticatedPrincipal,
    id: number,
    dto: UpdateUserProfileDto,
    context: AuditContext,
  ) {
    const target = await this.usersService.getFindById(id);
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (dto.isActive === false) {
      this.policy.assertNotSelf(actor, id);
      await this.policy.assertNotLastSuperAdmin(id);
    }

    const before = {
      firstName: target.firstName,
      lastName: target.lastName,
      isActive: target.isActive,
    };

    const saved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: withRoles,
      });

      await this.audit.record(
        context,
        {
          action:
            dto.isActive === false
              ? AUDIT_ACTIONS.USER_DEACTIVATED
              : AUDIT_ACTIONS.USER_UPDATED,
          entityType: 'admin_user',
          entityId: id,
          oldValue: before,
          newValue: {
            firstName: updated.firstName,
            lastName: updated.lastName,
            isActive: updated.isActive,
          },
        },
        tx,
      );

      return updated;
    });

    if (dto.isActive === false) {
      await this.usersService.clearRefreshTokenHash(id);
    }

    this.principalCache.invalidate(id);

    return saved;
  }

  async setRoles(
    actor: AuthenticatedPrincipal,
    id: number,
    dto: SetUserRolesDto,
    context: AuditContext,
  ) {
    this.policy.assertNotSelf(actor, id);

    const target = await this.usersService.getFindByIdWithRoles(id);
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.policy.assertCanAssignRoles(actor, dto.roleIds);
    const roles = await this.resolveRoles(dto.roleIds);

    const previousSlugs = target.roleAssignments.map((a) => a.role.slug);
    const currentlySuperAdmin = previousSlugs.includes(SUPER_ADMIN_ROLE_SLUG);
    const willRemainSuperAdmin = roles.some(
      (r) => r.slug === SUPER_ADMIN_ROLE_SLUG,
    );

    if (currentlySuperAdmin && !willRemainSuperAdmin) {
      await this.policy.assertNotLastSuperAdmin(id);
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      await tx.roleAssignment.deleteMany({ where: { userId: id } });
      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          roleAssignments: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        include: withRoles,
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.USER_ROLES_CHANGED,
          entityType: 'admin_user',
          entityId: id,
          oldValue: { roles: previousSlugs },
          newValue: { roles: roles.map((r) => r.slug) },
        },
        tx,
      );

      return updated;
    });

    this.principalCache.invalidate(id);

    return saved;
  }

  async resetPassword(
    id: number,
    dto: ResetPasswordDto,
    context: AuditContext,
  ) {
    const target = await this.usersService.getFindById(id);
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id },
        data: { password: hashedPassword },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
          entityType: 'admin_user',
          entityId: id,
        },
        tx,
      );
    });

    await this.usersService.clearRefreshTokenHash(id);
    this.principalCache.invalidate(id);
  }

  async remove(
    actor: AuthenticatedPrincipal,
    id: number,
    context: AuditContext,
  ): Promise<void> {
    this.policy.assertNotSelf(actor, id);

    const target = await this.usersService.getFindById(id);
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.policy.assertNotLastSuperAdmin(id);

    await this.usersService.clearRefreshTokenHash(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.delete({ where: { id } });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.USER_DELETED,
          entityType: 'admin_user',
          entityId: id,
          oldValue: { email: target.email },
        },
        tx,
      );
    });

    this.principalCache.invalidate(id);
  }
}
