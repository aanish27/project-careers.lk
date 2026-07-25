import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AuditModule } from '@/modules/audit/audit.module';
import { ScopedRoutePolicyAuditService } from '@/common/services/scoped-route-policy-audit.service';
import { PermissionsController } from './permissions.controller';
import {
  InMemoryPrincipalCache,
  PRINCIPAL_CACHE,
} from './principal-cache.service';
import { PrincipalService } from './principal.service';
import { RbacPolicyService } from './rbac-policy.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [DiscoveryModule, AuditModule],
  controllers: [RolesController, PermissionsController],
  providers: [
    PrincipalService,
    { provide: PRINCIPAL_CACHE, useClass: InMemoryPrincipalCache },
    RbacPolicyService,
    RolesService,
    ScopedRoutePolicyAuditService,
  ],
  exports: [RbacPolicyService, PRINCIPAL_CACHE, PrincipalService],
})
export class RbacModule {}
