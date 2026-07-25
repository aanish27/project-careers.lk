import { PERMISSIONS } from '@careerslk/lib';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { AuditContext } from '@/modules/audit/audit.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import {
  CreateRoleDto,
  RoleResponseDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  private auditContext(
    principal: AuthenticatedPrincipal,
    req: Request,
  ): AuditContext {
    return {
      actorUserId: principal.userId,
      actorEmail: principal.email,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List all roles with their permissions' })
  async findAll(): Promise<RoleResponseDto[]> {
    const [roles, counts] = await Promise.all([
      this.roles.findAll(),
      this.roles.userCounts(),
    ]);

    return roles.map((role) =>
      RoleResponseDto.from(role, counts.get(role.id) ?? 0),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Get a single role' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleResponseDto> {
    return RoleResponseDto.from(await this.roles.findOneOrFail(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Create a role' })
  @ApiForbiddenResponse({
    description: 'Attempted to grant a permission the caller does not hold.',
  })
  async create(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body() dto: CreateRoleDto,
    @Req() req: Request,
  ): Promise<RoleResponseDto> {
    const role = await this.roles.create(
      actor,
      dto,
      this.auditContext(actor, req),
    );
    return RoleResponseDto.from(role);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({
    summary: 'Rename a role or change its description',
    description: 'Cannot change the slug. Cannot modify a system role.',
  })
  async update(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ): Promise<RoleResponseDto> {
    const role = await this.roles.update(
      id,
      dto,
      this.auditContext(actor, req),
    );
    return RoleResponseDto.from(role);
  }

  @Put(':id/permissions')
  @RequirePermissions(PERMISSIONS.ROLES_PERMISSIONS_ASSIGN)
  @ApiOperation({
    summary: "Replace a role's permission set",
    description:
      'PUT, not PATCH: the supplied list becomes the complete set. Callers ' +
      'cannot grant permissions they do not themselves hold, and system roles ' +
      'are rejected.',
  })
  @ApiForbiddenResponse({
    description:
      'Attempted to grant an unheld permission, or to modify a system role.',
  })
  async setPermissions(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRolePermissionsDto,
    @Req() req: Request,
  ): Promise<RoleResponseDto> {
    const role = await this.roles.setPermissions(
      actor,
      id,
      dto,
      this.auditContext(actor, req),
    );
    return RoleResponseDto.from(role);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a role',
    description:
      'Refuses if the role is still assigned to any user, rather than ' +
      'cascading and silently removing their access.',
  })
  async remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    await this.roles.remove(id, this.auditContext(actor, req));
  }
}
