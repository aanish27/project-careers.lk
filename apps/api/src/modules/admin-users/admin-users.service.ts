import { Injectable } from '@nestjs/common';
import { AdminUser } from '@careerslk/database';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import {
  CursorPaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/admin-users.response.dto';
import { encodeCursor, decodeCursor } from '@/common/utils/cursor.util';

type CreateUserInput = Pick<
  AdminUser,
  'email' | 'password' | 'firstName' | 'lastName'
>;

const withRoles = { roleAssignments: { include: { role: true } } } as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { email } });
  }

  async getUserByEmailWithPassword(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({
      where: { email },
      omit: { password: false },
    });
  }

  async getFindById(id: number): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { id } });
  }

  async getFindByIdWithRoles(id: number) {
    return this.prisma.adminUser.findUnique({
      where: { id },
      include: withRoles,
    });
  }

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const existing = data.email && (await this.getUserByEmail(data.email));
    if (existing) {
      throw new Error('User already exists');
    }

    const safeData: CreateUserInput = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    return await this.prisma.adminUser.create({ data: safeData });
  }

  async getAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.adminUser.findMany({
      include: withRoles,
    });

    return plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Cursor-based pagination over users, ordered by id ASC.
   *
   * - Forward navigation: supply `cursor` (the `nextCursor` from a previous response).
   * - Backward navigation: supply `prevCursor` (the `prevCursor` from a previous response).
   * - First page: supply neither.
   */
  async getAllCursor(
    cursor: string | undefined,
    prevCursor: string | undefined,
    limit: number,
  ): Promise<CursorPaginatedUsersResponseDto> {
    const take = limit + 1;

    let users: (AdminUser & {
      roleAssignments: { role: { slug: string } }[];
    })[];

    if (cursor) {
      const afterId = decodeCursor(cursor);
      users = await this.prisma.adminUser.findMany({
        where: { id: { gt: afterId } },
        take,
        orderBy: { id: 'asc' },
        include: withRoles,
      });
    } else if (prevCursor) {
      const beforeId = decodeCursor(prevCursor);
      const reversed = await this.prisma.adminUser.findMany({
        where: { id: { lt: beforeId } },
        take,
        orderBy: { id: 'desc' },
        include: withRoles,
      });
      users = reversed.reverse();
    } else {
      users = await this.prisma.adminUser.findMany({
        take,
        orderBy: { id: 'asc' },
        include: withRoles,
      });
    }

    const hasExtraItem = users.length > limit;
    if (hasExtraItem) users.pop();

    const items = plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });

    const nextCursor =
      items.length > 0 && hasExtraItem
        ? encodeCursor(items[items.length - 1].id)
        : null;

    const resolvedPrevCursor =
      items.length > 0 && (cursor !== undefined || prevCursor !== undefined)
        ? encodeCursor(items[0].id)
        : null;

    return {
      items,
      limit,
      nextCursor,
      prevCursor: resolvedPrevCursor,
    };
  }

  async setRefreshTokenHash(
    userId: number,
    refreshTokenHash: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshTokenHash, 10);
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async clearRefreshTokenHash(userId: number): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}
