import { Injectable } from '@nestjs/common';
import { WebUser } from '@careerslk/database';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';

export interface UpsertWebUserInput {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

@Injectable()
export class WebUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoogleId(googleId: string): Promise<WebUser | null> {
    return this.prisma.webUser.findFirst({
      where: { googleId, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<WebUser | null> {
    return this.prisma.webUser.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findById(id: number): Promise<WebUser | null> {
    return this.prisma.webUser.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: UpsertWebUserInput): Promise<WebUser> {
    return this.prisma.webUser.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async touchLoginProfile(
    id: number,
    data: Pick<UpsertWebUserInput, 'firstName' | 'lastName' | 'avatarUrl'>,
  ): Promise<WebUser> {
    return this.prisma.webUser.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
        lastLoginAt: new Date(),
      },
    });
  }

  async setRefreshTokenHash(id: number, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.webUser.update({
      where: { id },
      data: { refreshTokenHash: hash },
    });
  }

  async clearRefreshTokenHash(id: number): Promise<void> {
    await this.prisma.webUser.update({
      where: { id },
      data: { refreshTokenHash: null },
    });
  }
}
