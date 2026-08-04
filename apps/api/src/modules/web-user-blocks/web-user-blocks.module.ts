import { Module } from '@nestjs/common';
import { WebUserBlocksController } from './web-user-blocks.controller';
import { WebUserBlocksService } from './web-user-blocks.service';

@Module({
  controllers: [WebUserBlocksController],
  providers: [WebUserBlocksService],
  exports: [WebUserBlocksService],
})
export class WebUserBlocksModule {}
