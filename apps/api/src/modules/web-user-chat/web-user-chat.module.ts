import { WebUserBlocksModule } from '@/modules/web-user-blocks/web-user-blocks.module';
import { MailModule } from '@/shared/mail/mail.module';
import { Module } from '@nestjs/common';
import { WebUserChatController } from './web-user-chat.controller';
import { WebUserChatService } from './web-user-chat.service';

@Module({
  imports: [WebUserBlocksModule, MailModule],
  controllers: [WebUserChatController],
  providers: [WebUserChatService],
})
export class WebUserChatModule {}
