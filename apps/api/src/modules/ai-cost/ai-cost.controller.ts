import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiCostService } from './ai-cost.service';

@Controller('ai-cost')
@UseGuards(PermissionsGuard)
export class AiCostController {
  constructor(private readonly aiCostService: AiCostService) {}

  @Get('claude-usage')
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  getClaudeUsage() {
    return this.aiCostService.getClaudeUsage();
  }

  @Get('deepseek-balance')
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  getDeepSeekBalance() {
    return this.aiCostService.getDeepSeekBalance();
  }
}
