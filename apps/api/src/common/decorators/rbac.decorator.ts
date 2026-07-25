import { PermissionKey } from '@careerslk/lib';
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import {
  IS_AUTHENTICATED_ONLY_KEY,
  PERMISSIONS_ALL_KEY,
  PERMISSIONS_ANY_KEY,
} from '../constants/rbac.constant';

export const Authenticated = () => SetMetadata(IS_AUTHENTICATED_ONLY_KEY, true);

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_ALL_KEY, permissions);

export const RequireAnyPermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);

export const CurrentPrincipal = createParamDecorator(
  <K extends keyof AuthenticatedPrincipal>(
    property: K | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedPrincipal | AuthenticatedPrincipal[K] => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedPrincipal }>();

    const principal = request.user;

    if (!principal) {
      throw new Error(
        '@CurrentPrincipal() used on a route with no authenticated principal. ' +
          'Did you mean to mark it @Public(), @Authenticated() or @RequirePermissions()?',
      );
    }

    return property ? principal[property] : principal;
  },
);
