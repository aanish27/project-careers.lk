import { Module } from '@nestjs/common';
import { AuditModule } from '@/modules/audit/audit.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUserManagementService } from './admin-user-management.service';

@Module({
  imports: [RbacModule, AuditModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminUserManagementService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
