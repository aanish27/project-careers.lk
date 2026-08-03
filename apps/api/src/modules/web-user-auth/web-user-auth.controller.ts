import {
  Body,
  Controller,
  Get,
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
  WebUserAuthResponseDto,
  WebUserLogoutResponseDto,
  WebUserRefreshResponseDto,
} from './dto/web-user-auth.dto';
import { WebUserJwtAuthGuard } from './guards/web-user-jwt-auth.guard';
import { AuthenticatedWebUserPrincipal } from './interfaces/web-user-jwt-payload.interface';

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
}
