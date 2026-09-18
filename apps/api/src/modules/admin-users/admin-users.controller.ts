import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { CursorPaginationDto } from '@/common/dto/pagination.dto';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { buildAuditContext } from '@/modules/audit/audit-context.util';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { Request } from 'express';
import { AdminUserManagementService } from './admin-user-management.service';
import { AdminUsersService } from './admin-users.service';
import {
  CreateUserDto,
  ResetPasswordDto,
  SetUserRolesDto,
  UpdateUserProfileDto,
} from './dto/admin-users.dto';
import {
  CursorPaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/admin-users.response.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(PermissionsGuard)
export class AdminUsersController {
  constructor(
    private readonly usersService: AdminUsersService,
    private readonly userManagement: AdminUserManagementService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns the list of all admin users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'Missing users.read permission' })
  async findAll() {
    return await this.usersService.getAll();
  }

  @Get('cursor')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiOperation({
    summary: 'Get all users with cursor pagination',
    description:
      'Returns a cursor-paginated list of users ordered by id. ' +
      'Pass `cursor` to advance forward or `prevCursor` to go backward.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cursor-paginated users list retrieved successfully',
    type: CursorPaginatedUsersResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'Missing users.read permission' })
  async findAllCursor(
    @Query() query: CursorPaginationDto,
  ): Promise<CursorPaginatedUsersResponseDto> {
    return this.usersService.getAllCursor(
      query.cursor,
      query.prevCursor,
      query.limit,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a specific user by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User unique identifier',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'Missing users.read permission' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.getFindByIdWithRoles(id);
    if (!user) throw new NotFoundException('Not found user');
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiForbiddenResponse({
    description:
      'Missing users.create permission, or attempted to assign the super admin role without holding it.',
  })
  async create(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body() dto: CreateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.userManagement.create(
      actor,
      dto,
      buildAuditContext(actor, req),
    );
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({
    summary: 'Update a user profile',
    description:
      'Profile fields and active status only — roles and password have their own endpoints.',
  })
  @ApiForbiddenResponse({
    description:
      'Missing users.update permission, or attempted to deactivate yourself or the last active super admin.',
  })
  async updateProfile(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserProfileDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.userManagement.updateProfile(
      actor,
      id,
      dto,
      buildAuditContext(actor, req),
    );
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Put(':id/roles')
  @RequirePermissions(PERMISSIONS.USERS_ROLES_ASSIGN)
  @ApiOperation({
    summary: "Replace a user's role set",
    description:
      'PUT, not PATCH: the supplied list becomes the complete set. You cannot ' +
      'change your own roles, assign the super admin role without holding it, ' +
      'or demote the last active super admin.',
  })
  @ApiForbiddenResponse({
    description:
      'Self-modification, unauthorized super-admin grant, or last-super-admin demotion.',
  })
  async setRoles(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRolesDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.userManagement.setRoles(
      actor,
      id,
      dto,
      buildAuditContext(actor, req),
    );
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/password')
  @RequirePermissions(PERMISSIONS.USERS_PASSWORD_RESET)
  @ApiOperation({ summary: "Reset another user's password" })
  async resetPassword(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ success: true }> {
    await this.userManagement.resetPassword(
      id,
      dto,
      buildAuditContext(actor, req),
    );
    return { success: true };
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Soft delete. You cannot delete yourself or the last active super admin.',
  })
  async remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    await this.userManagement.remove(actor, id, buildAuditContext(actor, req));
  }
}
