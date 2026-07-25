import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  IPrincipalCache,
  PRINCIPAL_CACHE,
} from '@/modules/rbac/principal-cache.service';
import {
  AuthenticatedPrincipal,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(PRINCIPAL_CACHE)
    private readonly principals: IPrincipalCache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedPrincipal> {
    const principal = await this.principals.get(payload.sub);

    if (!principal || !principal.isActive) {
      throw new UnauthorizedException();
    }

    return principal;
  }
}
