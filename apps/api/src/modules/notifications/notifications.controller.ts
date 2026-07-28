import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_READ)
  findAll(@Query('limit') limit?: string) {
    return this.notificationsService.findAll(limit ? Number(limit) : undefined);
  }

  @Patch(':id/read')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_READ)
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id);
  }

  @Patch('read-all')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_READ)
  markAllRead() {
    return this.notificationsService.markAllRead();
  }
}
