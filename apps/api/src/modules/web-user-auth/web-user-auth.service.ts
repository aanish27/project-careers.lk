import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { WebUser } from '@careerslk/database';
import * as bcrypt from 'bcrypt';
import { WebUsersService } from '@/modules/web-users/web-users.service';
import {
  GoogleUpsertDto,
  WebUserAuthResponseDto,
} from './dto/web-user-auth.dto';
import { WebUserJwtPayload } from './interfaces/web-user-jwt-payload.interface';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function toUserData(user: WebUser): WebUserAuthResponseDto['user'] {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  };
}

@Injectable()
export class WebUserAuthService {
  constructor(
    private readonly webUsers: WebUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateTokenPair(user: WebUser): TokenPair {
    const payload: WebUserJwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwtWebUser.secret'),
      expiresIn:
        this.configService.get<JwtSignOptions['expiresIn']>(
          'jwtWebUser.expiresIn',
        ) ?? '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwtWebUser.refreshSecret'),
      expiresIn:
        this.configService.get<JwtSignOptions['expiresIn']>(
          'jwtWebUser.refreshExpiresIn',
        ) ?? '7d',
    });

    return { accessToken, refreshToken };
  }

  // Trusts the caller (gated by InternalOnlyGuard at the controller) to have
  // already verified this profile with Google. Looks up by googleId first —
  // that's the stable identifier — and only falls back to email to detect a
  // collision, never to silently merge accounts.
  async upsertFromGoogleProfile(
    dto: GoogleUpsertDto,
  ): Promise<WebUserAuthResponseDto & TokenPair> {
    let user = await this.webUsers.findByGoogleId(dto.googleId);

    if (!user) {
      const existingByEmail = await this.webUsers.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException(
          'This email is already associated with a different Google account',
        );
      }

      user = await this.webUsers.create({
        googleId: dto.googleId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      });
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }
      user = await this.webUsers.touchLoginProfile(user.id, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      });
    }

    const tokens = this.generateTokenPair(user);
    await this.webUsers.setRefreshTokenHash(user.id, tokens.refreshToken);

    return { ...tokens, user: toUserData(user) };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<WebUserJwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwtWebUser.refreshSecret'),
      });

      const user = await this.webUsers.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (
        !user.refreshTokenHash ||
        !(await bcrypt.compare(refreshToken, user.refreshTokenHash))
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokenPair(user);
      await this.webUsers.setRefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(webUserId: number): Promise<void> {
    await this.webUsers.clearRefreshTokenHash(webUserId);
  }

  async getCurrentUser(
    webUserId: number,
  ): Promise<WebUserAuthResponseDto['user']> {
    const user = await this.webUsers.findById(webUserId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserData(user);
  }
}
