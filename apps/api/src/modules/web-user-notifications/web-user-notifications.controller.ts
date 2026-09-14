import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WebUserNotificationsService } from './web-user-notifications.service';

@Controller('web-users/notifications')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserNotificationsController {
  constructor(
    private readonly webUserNotificationsService: WebUserNotificationsService,
  ) {}

  @Get()
  findMine(
    @CurrentUser('webUserId') webUserId: number,
    @Query('limit') limit?: string,
  ) {
    return this.webUserNotificationsService.findMine(
      webUserId,
      limit ? Number(limit) : undefined,
    );
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserNotificationsService.markRead(webUserId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserNotificationsService.markAllRead(webUserId);
  }
}
