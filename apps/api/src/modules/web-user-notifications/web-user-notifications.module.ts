import { Module } from '@nestjs/common';
import { WebUserNotificationsController } from './web-user-notifications.controller';
import { WebUserNotificationsService } from './web-user-notifications.service';

@Module({
  controllers: [WebUserNotificationsController],
  providers: [WebUserNotificationsService],
  exports: [WebUserNotificationsService],
})
export class WebUserNotificationsModule {}
