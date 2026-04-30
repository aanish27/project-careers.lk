import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CursorPaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/users.response.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/role.guard';
import { UserRole } from 'generated/prisma/enums';
import { plainToInstance } from 'class-transformer';
import {
  CursorPaginationDto,
  PaginationDto,
} from '@/common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Returns a paginated list of all users. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have ADMIN role' })
  async findAll(@Query() pagination: PaginationDto) {
    return await this.usersService.getAll(pagination.page, pagination.limit);
  }

  @Get('cursor')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users with cursor pagination (Admin only)',
    description:
      'Returns a cursor-paginated list of users ordered by id. ' +
      'Pass `cursor` to advance forward or `prevCursor` to go backward. ' +
      'Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cursor-paginated users list retrieved successfully',
    type: CursorPaginatedUsersResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have ADMIN role' })
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID (Admin only)',
    description: 'Returns a specific user by their ID. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User unique identifier',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have ADMIN role',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.getFindById(id);
    if (!user) throw new NotFoundException('Not found user');
    const result = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    return result;
  }
}
