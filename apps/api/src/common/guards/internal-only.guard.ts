import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'crypto';

// Restricts a route to callers that present the shared INTERNAL_API_KEY —
// used by endpoints (e.g. the Google-upsert web-user route) whose trust model
// depends on the caller having already done some verification of its own
// (there, verifying a Google profile) rather than on the request carrying a
// user's own credentials.
@Injectable()
export class InternalOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-internal-key'];
    const expected = this.config.getOrThrow<string>('internal.apiKey');

    if (typeof provided !== 'string') return false;

    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    return (
      providedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    );
  }
}
