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
import { normalizeEmail } from '@/common/utils/email.util';
import {
  GoogleUpsertDto,
  WebUserAuthResponseDto,
} from './dto/web-user-auth.dto';
import { WebUserJwtPayload } from './interfaces/web-user-jwt-payload.interface';
import { WebUserEmailOtpService } from './web-user-email-otp.service';

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
    companyId: user.companyId,
  };
}

@Injectable()
export class WebUserAuthService {
  constructor(
    private readonly webUsers: WebUsersService,
    private readonly emailOtp: WebUserEmailOtpService,
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

  private async issueSession(
    user: WebUser,
  ): Promise<WebUserAuthResponseDto & TokenPair> {
    const tokens = this.generateTokenPair(user);
    await this.webUsers.setRefreshTokenHash(user.id, tokens.refreshToken);
    return { ...tokens, user: toUserData(user) };
  }

  // Trusts the caller (gated by InternalOnlyGuard at the controller) to have
  // already verified this profile with Google — but only for a profile Google
  // itself marked as verified. Without that check, an attacker presenting a
  // Google profile with an unverified `email` claim could hijack any
  // email-only WebUser row that happens to share that address (both the
  // linking branch below and the pre-existing 409-collision branch trust the
  // email claim, so both need this gate).
  async upsertFromGoogleProfile(
    dto: GoogleUpsertDto,
  ): Promise<WebUserAuthResponseDto & TokenPair> {
    if (dto.emailVerified !== true) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const email = normalizeEmail(dto.email);
    let user = await this.webUsers.findByGoogleId(dto.googleId);

    if (!user) {
      const existingByEmail = await this.webUsers.findByEmail(email);

      if (existingByEmail && existingByEmail.googleId === null) {
        // Email-only account (created via email-OTP) signing in with Google
        // for the first time — link rather than create a second account.
        user = await this.webUsers.linkGoogleId(
          existingByEmail.id,
          dto.googleId,
          {
            firstName: dto.firstName,
            lastName: dto.lastName,
            avatarUrl: dto.avatarUrl,
          },
        );
      } else if (existingByEmail) {
        // This email is already linked to a *different* Google account —
        // a genuine anomaly, not something to silently reassign.
        throw new ConflictException(
          'This email is already associated with a different Google account',
        );
      } else {
        user = await this.webUsers.create({
          googleId: dto.googleId,
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatarUrl: dto.avatarUrl,
        });
      }
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

    return this.issueSession(user);
  }

  async requestEmailOtp(email: string): Promise<void> {
    await this.emailOtp.generate(normalizeEmail(email));
  }

  // OTP verification proves ownership of the mailbox directly (no external
  // party's word to trust, unlike the Google flow) — so unlike Google upsert,
  // this always finds-or-creates by email, regardless of whether the account
  // already has a googleId. Email is the shared identifier across both
  // sign-in methods.
  async verifyEmailOtp(
    rawEmail: string,
    code: string,
  ): Promise<WebUserAuthResponseDto & TokenPair> {
    const email = normalizeEmail(rawEmail);
    await this.emailOtp.verify(email, code);

    let user = await this.webUsers.findByEmail(email);

    if (!user) {
      user = await this.webUsers.create({ email });
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }
      user = await this.webUsers.touchLoginProfile(user.id, {
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
      });
    }

    return this.issueSession(user);
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

  async updateProfile(
    webUserId: number,
    data: { firstName?: string; lastName?: string },
  ): Promise<WebUserAuthResponseDto['user']> {
    const user = await this.webUsers.updateProfile(webUserId, data);
    return toUserData(user);
  }
}
