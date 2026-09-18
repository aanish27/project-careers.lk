import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import type { AuditContext } from './audit.service';

export function buildAuditContext(
  principal: AuthenticatedPrincipal,
  req: Request,
): AuditContext {
  return {
    actorUserId: principal.userId,
    actorEmail: principal.email,
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
  };
}
