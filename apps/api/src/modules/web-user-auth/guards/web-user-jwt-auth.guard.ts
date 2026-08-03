import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Not global (unlike the admin JwtAuthGuard) — applied per-route only where
// web-user auth is actually required. Routes using this must also carry
// @Public() so the global admin JwtAuthGuard (hardcoded to the 'jwt'
// strategy) doesn't reject the web user's token first.
@Injectable()
export class WebUserJwtAuthGuard extends AuthGuard('jwt-web-user') {}
