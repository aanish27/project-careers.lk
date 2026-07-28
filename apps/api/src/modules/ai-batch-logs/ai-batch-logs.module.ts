import { Module } from '@nestjs/common';
import { AiBatchLogsController } from './ai-batch-logs.controller';
import { AiBatchLogsService } from './ai-batch-logs.service';

@Module({
  controllers: [AiBatchLogsController],
  providers: [AiBatchLogsService],
})
export class AiBatchLogsModule {}
