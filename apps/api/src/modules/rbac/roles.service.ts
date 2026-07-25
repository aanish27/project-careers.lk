import { PermissionKey } from '@careerslk/lib';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { IPrincipalCache, PRINCIPAL_CACHE } from './principal-cache.service';
import {
  CreateRoleDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RbacPolicyService } from './rbac-policy.service';

const roleWithPermissionsInclude = {
  permissionAssignments: { include: { permission: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RbacPolicyService,
    private readonly audit: AuditService,
    @Inject(PRINCIPAL_CACHE)
    private readonly principalCache: IPrincipalCache,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: roleWithPermissionsInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOneOrFail(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  private async resolvePermissionKeys(
    ids: number[],
  ): Promise<{ id: number; key: string }[]> {
    if (ids.length === 0) {
      return [];
    }

    const found = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
    });

    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Unknown permission id(s): ${missing.join(', ')}`,
      );
    }

    return found;
  }

  async create(
    actor: AuthenticatedPrincipal,
    dto: CreateRoleDto,
    context: AuditContext,
  ) {
    const existing = await this.prisma.role.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `A role with slug '${dto.slug}' already exists`,
      );
    }

    const permissions = await this.resolvePermissionKeys(
      dto.permissionIds ?? [],
    );

    this.policy.assertCanGrantPermissions(
      actor,
      permissions.map((p) => p.key as PermissionKey),
    );

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          description: dto.description ?? null,
          isSystem: false,
          permissionAssignments: {
            create: permissions.map((p) => ({ permissionId: p.id })),
          },
        },
        include: roleWithPermissionsInclude,
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.ROLE_CREATED,
          entityType: 'role',
          entityId: role.id,
          newValue: {
            slug: role.slug,
            name: role.name,
            permissions: permissions.map((p) => p.key),
          },
        },
        tx,
      );

      return role;
    });
  }

  async update(id: number, dto: UpdateRoleDto, context: AuditContext) {
    const role = await this.findOneOrFail(id);

    this.policy.assertRoleIsMutable(role);

    const before = { name: role.name, description: role.description };

    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.role.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
        },
        include: roleWithPermissionsInclude,
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.ROLE_UPDATED,
          entityType: 'role',
          entityId: id,
          oldValue: before,
          newValue: { name: saved.name, description: saved.description },
        },
        tx,
      );

      return saved;
    });
  }

  async setPermissions(
    actor: AuthenticatedPrincipal,
    id: number,
    dto: SetRolePermissionsDto,
    context: AuditContext,
  ) {
    const role = await this.findOneOrFail(id);

    this.policy.assertRoleIsMutable(role);

    const permissions = await this.resolvePermissionKeys(dto.permissionIds);
    const nextKeys = permissions.map((p) => p.key as PermissionKey);
    const previousKeys = role.permissionAssignments.map(
      (a) => a.permission.key as PermissionKey,
    );

    const added = nextKeys.filter((key) => !previousKeys.includes(key));
    this.policy.assertCanGrantPermissions(actor, added);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      const saved = await tx.role.update({
        where: { id },
        data: {
          permissionAssignments: {
            create: permissions.map((p) => ({ permissionId: p.id })),
          },
        },
        include: roleWithPermissionsInclude,
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.ROLE_PERMISSIONS_CHANGED,
          entityType: 'role',
          entityId: id,
          oldValue: { permissions: previousKeys },
          newValue: { permissions: nextKeys },
        },
        tx,
      );

      return saved;
    });

    this.principalCache.invalidateAll();

    return result;
  }

  async remove(id: number, context: AuditContext): Promise<void> {
    const role = await this.findOneOrFail(id);

    this.policy.assertRoleIsMutable(role);

    const assignedCount = await this.prisma.roleAssignment.count({
      where: { roleId: id },
    });

    if (assignedCount > 0) {
      throw new ConflictException(
        `Role '${role.slug}' is still assigned to ${assignedCount} user(s). ` +
          'Reassign them before deleting it.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.role.delete({ where: { id } });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.ROLE_DELETED,
          entityType: 'role',
          entityId: id,
          oldValue: { slug: role.slug, name: role.name },
        },
        tx,
      );
    });

    this.principalCache.invalidateAll();
  }

  async userCounts(): Promise<Map<number, number>> {
    const rows = await this.prisma.roleAssignment.groupBy({
      by: ['roleId'],
      _count: true,
    });

    return new Map(rows.map((row) => [row.roleId, row._count]));
  }
}
