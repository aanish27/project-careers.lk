import { Module } from '@nestjs/common';
import { WebUsersService } from './web-users.service';

@Module({
  providers: [WebUsersService],
  exports: [WebUsersService],
})
export class WebUsersModule {}
