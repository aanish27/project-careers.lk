import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  SendMessageInput,
  sendMessageSchema,
  StartConversationInput,
  startConversationSchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WebUserChatService } from './web-user-chat.service';

@Controller('web-users/chat')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserChatController {
  constructor(private readonly webUserChatService: WebUserChatService) {}

  @Post('conversations')
  startConversation(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(startConversationSchema))
    dto: StartConversationInput,
  ) {
    return this.webUserChatService.startOrGetConversation(webUserId, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserChatService.listConversations(webUserId);
  }

  @Get('conversations/:id')
  getConversation(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserChatService.getConversation(webUserId, id);
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
  ) {
    return this.webUserChatService.listMessages(webUserId, id, {
      limit: limit ? Number(limit) : undefined,
      beforeId: beforeId ? Number(beforeId) : undefined,
    });
  }

  @Post('conversations/:id/messages')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  sendMessage(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageInput,
  ) {
    return this.webUserChatService.sendMessage(webUserId, id, dto);
  }
}
