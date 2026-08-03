import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { WebUsersModule } from '@/modules/web-users/web-users.module';
import { WebUserAuthController } from './web-user-auth.controller';
import { WebUserAuthService } from './web-user-auth.service';
import { WebUserJwtStrategy } from './strategies/web-user-jwt.strategy';

@Module({
  imports: [
    WebUsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtWebUser.secret'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WebUserAuthController],
  providers: [WebUserAuthService, WebUserJwtStrategy],
  exports: [WebUserAuthService],
})
export class WebUserAuthModule {}
