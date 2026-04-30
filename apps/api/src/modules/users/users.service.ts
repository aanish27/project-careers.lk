import { Inject, Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import {
  IUsersRepository,
  USER_REPOSITORY,
} from './repositories/users.repository.interface';
import {
  CursorPaginatedUsersResponseDto,
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/users.response.dto';
import { encodeCursor, decodeCursor } from '@/common/utils/cursor.util';

type CreateUserInput = Pick<
  User,
  'email' | 'username' | 'password' | 'firstName' | 'lastName'
>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async getFindById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async createUser(data: CreateUserInput): Promise<User> {
    // Check if exists
    const existing =
      data.email && (await this.usersRepository.findByEmail(data.email));
    if (existing) {
      throw new Error('User already exists');
    }

    const safeData: CreateUserInput = {
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    return await this.usersRepository.create(safeData);
  }

  async getAll(
    page: number,
    limit: number,
  ): Promise<PaginatedUsersResponseDto> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.usersRepository.findAll({ skip, take: limit }),
      this.usersRepository.count(),
    ]);

    return {
      items: plainToInstance(UserResponseDto, users, {
        excludeExtraneousValues: true,
      }),
      page,
      limit,
      total,
    };
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
      users = await this.usersRepository.findAll({
        where: { id: { gt: afterId } } as any,
        take,
        orderBy: { id: 'asc' } as any,
      });
    } else if (prevCursor) {
      // Backward: fetch items before the given cursor id in descending order, then flip
      const beforeId = decodeCursor(prevCursor);
      const reversed = await this.usersRepository.findAll({
        where: { id: { lt: beforeId } } as any,
        take,
        orderBy: { id: 'desc' } as any,
      });
      users = reversed.reverse();
    } else {
      // First page
      users = await this.usersRepository.findAll({
        take,
        orderBy: { id: 'asc' } as any,
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
    userId: string,
    refreshTokenHash: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshTokenHash, 10);
    await this.usersRepository.update(userId, {
      refreshTokenHash: hash,
    });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
  }
}
