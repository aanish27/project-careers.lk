import { Injectable } from '@nestjs/common';
import { User } from '@careerslk/database';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import {
  CursorPaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/users.response.dto';
import { encodeCursor, decodeCursor } from '@/common/utils/cursor.util';

type CreateUserInput = Pick<
  User,
  'email' | 'password' | 'firstName' | 'lastName'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      omit: { password: false },
    });
  }

  async getFindById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: CreateUserInput): Promise<User> {
    // Check if exists
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

    return await this.prisma.user.create({ data: safeData });
  }

  async getAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany();

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
    // Fetch limit + 1 to detect whether another page exists
    const take = limit + 1;

    let users: User[];

    if (cursor) {
      // Forward: start after the given cursor id
      const afterId = decodeCursor(cursor);
      users = await this.prisma.user.findMany({
        where: { id: { gt: afterId } },
        take,
        orderBy: { id: 'asc' },
      });
    } else if (prevCursor) {
      // Backward: fetch items before the given cursor id in descending order, then flip
      const beforeId = decodeCursor(prevCursor);
      const reversed = await this.prisma.user.findMany({
        where: { id: { lt: beforeId } },
        take,
        orderBy: { id: 'desc' },
      });
      users = reversed.reverse();
    } else {
      // First page
      users = await this.prisma.user.findMany({
        take,
        orderBy: { id: 'asc' },
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async clearRefreshTokenHash(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}
