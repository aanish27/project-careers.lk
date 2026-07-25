import { PERMISSIONS } from '@careerslk/lib';
import { PermissionGroup } from '@careerslk/types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/database/prisma.service';
import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({
    summary: 'List all permissions, grouped by module',
    description:
      'Drives the role editor. Registry is code-defined, so there is no create/update/delete here.',
  })
  async findAll(): Promise<PermissionGroup[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    const groups = new Map<string, PermissionGroup>();

    for (const permission of permissions) {
      let group = groups.get(permission.module);

      if (!group) {
        group = { module: permission.module, permissions: [] };
        groups.set(permission.module, group);
      }

      group.permissions.push({
        id: permission.id,
        key: permission.key as PermissionGroup['permissions'][number]['key'],
        action: permission.action,
        description: permission.description,
      });
    }

    return [...groups.values()];
  }
}
