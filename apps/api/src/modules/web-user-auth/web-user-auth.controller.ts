import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { InternalOnlyGuard } from '@/common/guards/internal-only.guard';
import {
  COOKIE_PATHS,
  REFRESH_TOKEN_MAX_AGE_MS,
  WEB_USER_REFRESH_COOKIE,
} from '@/common/constants/routes.constant';
import { WebUserAuthService } from './web-user-auth.service';
import {
  GoogleUpsertDto,
  RequestEmailOtpDto,
  RequestEmailOtpResponseDto,
  VerifyEmailOtpDto,
  WebUserAuthResponseDto,
  WebUserLogoutResponseDto,
  WebUserRefreshResponseDto,
} from './dto/web-user-auth.dto';
import { WebUserJwtAuthGuard } from './guards/web-user-jwt-auth.guard';
import { AuthenticatedWebUserPrincipal } from './interfaces/web-user-jwt-payload.interface';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  UpdateWebUserProfileInput,
  updateWebUserProfileSchema,
} from '@careerslk/types';

@ApiTags('Web User Authentication')
@Controller('web-users/auth')
export class WebUserAuthController {
  constructor(private readonly webUserAuthService: WebUserAuthService) {}

  // @Public() bypasses the global admin JwtAuthGuard (hardcoded to the 'jwt'
  // strategy). InternalOnlyGuard is the real check here — this endpoint's
  // trust model is "the caller already verified this profile with Google",
  // which only the Next.js server is trusted to have done.
  @Public()
  @UseGuards(InternalOnlyGuard)
  @Post('google/upsert')
  @ApiOperation({
    summary:
      'Create or sign in a web-user account from a verified Google profile',
  })
  @ApiResponse({ status: 200, type: WebUserAuthResponseDto })
  async googleUpsert(
    @Body() dto: GoogleUpsertDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebUserAuthResponseDto> {
    const { user, accessToken, refreshToken } =
      await this.webUserAuthService.upsertFromGoogleProfile(dto);

    res.cookie(WEB_USER_REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: COOKIE_PATHS.webUserAuthRefresh,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { user, accessToken };
  }

  // InternalOnlyGuard is defense-in-depth here (only the Next.js server
  // should be able to reach this at all), but it does NOT provide the real
  // anti-abuse property — the actual per-recipient-email rate gate and
  // resend cooldown live inside WebUserEmailOtpService.generate(), since
  // this endpoint is reached through the legitimate browser → Next.js
  // Server Action → API path on every real user's request, using the same
  // internal key every time. @Throttle's per-IP limiting is only a coarse
  // second layer, not the actual defense.
  @Public()
  @UseGuards(InternalOnlyGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('email/otp/request')
  @ApiOperation({ summary: 'Send a sign-in code to an email address' })
  @ApiResponse({ status: 200, type: RequestEmailOtpResponseDto })
  async requestEmailOtp(
    @Body() dto: RequestEmailOtpDto,
  ): Promise<RequestEmailOtpResponseDto> {
    await this.webUserAuthService.requestEmailOtp(dto.email);
    // Always a generic success — never reveals whether an account already
    // exists for this email.
    return { success: true };
  }

  @Public()
  @UseGuards(InternalOnlyGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('email/otp/verify')
  @ApiOperation({ summary: 'Verify a sign-in code and issue a session' })
  @ApiResponse({ status: 200, type: WebUserAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired code' })
  async verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebUserAuthResponseDto> {
    const { user, accessToken, refreshToken } =
      await this.webUserAuthService.verifyEmailOtp(dto.email, dto.code);

    res.cookie(WEB_USER_REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: COOKIE_PATHS.webUserAuthRefresh,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh a web-user access token' })
  @ApiResponse({ status: 200, type: WebUserRefreshResponseDto })
  @ApiUnauthorizedResponse({
    description: 'No refresh token or invalid refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebUserRefreshResponseDto> {
    const refreshToken = req.cookies[WEB_USER_REFRESH_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.webUserAuthService.refresh(refreshToken);

    res.cookie(WEB_USER_REFRESH_COOKIE, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: COOKIE_PATHS.webUserAuthRefresh,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { accessToken };
  }

  @Public()
  @UseGuards(WebUserJwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log out the current web user' })
  @ApiResponse({ status: 200, type: WebUserLogoutResponseDto })
  async logout(
    @CurrentUser('webUserId') webUserId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebUserLogoutResponseDto> {
    await this.webUserAuthService.logout(webUserId);
    res.clearCookie(WEB_USER_REFRESH_COOKIE, {
      path: COOKIE_PATHS.webUserAuthRefresh,
    });
    return { success: true };
  }

  @Public()
  @UseGuards(WebUserJwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get the current web user' })
  @ApiResponse({ status: 200, type: WebUserAuthResponseDto })
  async me(
    @CurrentUser() principal: AuthenticatedWebUserPrincipal,
  ): Promise<WebUserAuthResponseDto['user']> {
    return this.webUserAuthService.getCurrentUser(principal.webUserId);
  }

  @Public()
  @UseGuards(WebUserJwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Update the current web user's profile" })
  @ApiResponse({ status: 200, type: WebUserAuthResponseDto })
  async updateMe(
    @CurrentUser() principal: AuthenticatedWebUserPrincipal,
    @Body(new ZodValidationPipe(updateWebUserProfileSchema))
    dto: UpdateWebUserProfileInput,
  ): Promise<WebUserAuthResponseDto['user']> {
    return this.webUserAuthService.updateProfile(principal.webUserId, dto);
  }
}
