import { PermissionKey } from '@careerslk/types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  IS_AUTHENTICATED_ONLY_KEY,
  PERMISSIONS_ALL_KEY,
  PERMISSIONS_ANY_KEY,
} from '../constants/rbac.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const handler = context.getHandler();
    const controller = context.getClass();
    const targets = [handler, controller];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedPrincipal }>();
    const principal = request.user;

    if (!principal) {
      throw new UnauthorizedException();
    }

    if (principal.isSuperAdmin) {
      return true;
    }

    const authenticatedOnly = this.reflector.getAllAndOverride<boolean>(
      IS_AUTHENTICATED_ONLY_KEY,
      targets,
    );

    if (authenticatedOnly) {
      return true;
    }

    const requireAll = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_ALL_KEY,
      targets,
    );

    if (requireAll?.length) {
      const missing = requireAll.filter((p) => !principal.permissions.has(p));

      if (missing.length > 0) {
        throw new ForbiddenException(
          `Missing required permission(s): ${missing.join(', ')}`,
        );
      }

      return true;
    }

    const requireAny = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_ANY_KEY,
      targets,
    );

    if (requireAny?.length) {
      const satisfied = requireAny.some((p) => principal.permissions.has(p));

      if (!satisfied) {
        throw new ForbiddenException(
          `Requires at least one of: ${requireAny.join(', ')}`,
        );
      }

      return true;
    }

    this.logger.error(
      `Route ${controller.name}.${handler.name} declares no access policy and was denied. ` +
        'Add @Public(), @Authenticated(), @RequirePermissions(...) or @RequireAnyPermission(...).',
    );

    throw new ForbiddenException('No access policy declared for this route');
  }
}
