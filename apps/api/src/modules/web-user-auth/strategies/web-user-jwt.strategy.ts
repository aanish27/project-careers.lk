import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { WebUsersService } from '@/modules/web-users/web-users.service';
import {
  AuthenticatedWebUserPrincipal,
  WebUserJwtPayload,
} from '../interfaces/web-user-jwt-payload.interface';

// Distinct Passport strategy name ('jwt-web-user') and secret (JWT_WEB_USER_SECRET)
// from the admin JwtStrategy — a web-user token must never be able to validate
// against the admin strategy or vice versa. See web-user-auth module notes.
@Injectable()
export class WebUserJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-web-user',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly webUsers: WebUsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwtWebUser.secret'),
    });
  }

  async validate(
    payload: WebUserJwtPayload,
  ): Promise<AuthenticatedWebUserPrincipal> {
    const user = await this.webUsers.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return { webUserId: user.id, email: user.email, isActive: user.isActive };
  }
}
