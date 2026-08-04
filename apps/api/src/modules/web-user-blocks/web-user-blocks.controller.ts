import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import { BlockUserInput, blockUserSchema } from '@careerslk/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WebUserBlocksService } from './web-user-blocks.service';

@Controller('web-users/blocks')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserBlocksController {
  constructor(private readonly webUserBlocksService: WebUserBlocksService) {}

  @Post()
  block(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(blockUserSchema)) dto: BlockUserInput,
  ) {
    return this.webUserBlocksService.block(webUserId, dto.blockedWebUserId);
  }

  @Delete(':blockedWebUserId')
  unblock(
    @CurrentUser('webUserId') webUserId: number,
    @Param('blockedWebUserId', ParseIntPipe) blockedWebUserId: number,
  ) {
    return this.webUserBlocksService.unblock(webUserId, blockedWebUserId);
  }

  @Get()
  listBlocked(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserBlocksService.listBlocked(webUserId);
  }
}
