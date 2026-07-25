import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import {
  IS_AUTHENTICATED_ONLY_KEY,
  PERMISSIONS_ALL_KEY,
  PERMISSIONS_ANY_KEY,
} from '../constants/rbac.constant';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

/**
 * Refuses to start the application if any route on a PermissionsGuard-scoped
 * controller declares no access policy. Only controllers that opt into
 * PermissionsGuard via @UseGuards are audited — other controllers in the app
 * (Companies, Jobs, etc.) are out of scope for this pass and untouched.
 */
@Injectable()
export class ScopedRoutePolicyAuditService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScopedRoutePolicyAuditService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    const undeclared: string[] = [];
    let audited = 0;

    for (const wrapper of this.discovery.getControllers()) {
      const instance = wrapper.instance as unknown;
      const { metatype } = wrapper;

      if (!instance || typeof instance !== 'object' || !metatype) {
        continue;
      }

      const guards = (Reflect.getMetadata(GUARDS_METADATA, metatype) ??
        []) as unknown[];
      const isScoped = guards.some(
        (guard) =>
          guard === PermissionsGuard || guard instanceof PermissionsGuard,
      );

      if (!isScoped) {
        continue;
      }

      const prototype = Object.getPrototypeOf(instance) as object;
      const controllerName = metatype.name;

      this.scanner.getAllMethodNames(prototype).forEach((methodName) => {
        const handler = (instance as Record<string, unknown>)[methodName];

        if (typeof handler !== 'function') {
          return;
        }

        const isRoute =
          Reflect.getMetadata(PATH_METADATA, handler) !== undefined;

        if (!isRoute) {
          return;
        }

        audited++;

        const targets = [handler, metatype];

        const hasPolicy =
          this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets) ||
          this.reflector.getAllAndOverride<boolean>(
            IS_AUTHENTICATED_ONLY_KEY,
            targets,
          ) ||
          (this.reflector.getAllAndOverride<unknown[]>(
            PERMISSIONS_ALL_KEY,
            targets,
          )?.length ?? 0) > 0 ||
          (this.reflector.getAllAndOverride<unknown[]>(
            PERMISSIONS_ANY_KEY,
            targets,
          )?.length ?? 0) > 0;

        if (!hasPolicy) {
          undeclared.push(`${controllerName}.${methodName}`);
        }
      });
    }

    if (undeclared.length > 0) {
      throw new Error(
        `${undeclared.length} route(s) declare no access policy:\n` +
          undeclared.map((route) => `  - ${route}`).join('\n') +
          '\n\nEvery route on a PermissionsGuard-scoped controller must declare ' +
          'one of: @Public(), @Authenticated(), @RequirePermissions(...) or ' +
          '@RequireAnyPermission(...).',
      );
    }

    this.logger.log(`Route policy audit passed: ${audited} route(s) declared`);
  }
}
