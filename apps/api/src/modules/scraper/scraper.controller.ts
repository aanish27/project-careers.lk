import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { buildAuditContext } from '@/modules/audit/audit-context.util';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import { ScrapeType } from '@careerslk/types';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ScrapeManyDto } from './dto/scraper.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
@UseGuards(PermissionsGuard)
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('companies/:id')
  @RequirePermissions(PERMISSIONS.SCRAPER_COMPANY_TRIGGER)
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeCompany(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.scraperService.scrapeOne(
      id,
      ScrapeType.COMPANY,
      buildAuditContext(actor, req),
    );

    return { queued: true, message: 'Company scrape has been queued' };
  }

  @Post('companies')
  @RequirePermissions(PERMISSIONS.SCRAPER_COMPANY_TRIGGER)
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeCompanies(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body() scrapeManyDto: ScrapeManyDto,
    @Req() req: Request,
  ) {
    await this.scraperService.scrapeMany(
      scrapeManyDto.ids,
      ScrapeType.COMPANY,
      buildAuditContext(actor, req),
    );

    return { queued: true, message: 'Company scrapes have been queued' };
  }

  @Post('jobs/:id')
  @RequirePermissions(PERMISSIONS.SCRAPER_JOBS_TRIGGER)
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeJob(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.scraperService.scrapeOne(
      id,
      ScrapeType.JOBS,
      buildAuditContext(actor, req),
    );

    return { queued: true, message: 'Job scrape has been queued' };
  }

  @Post('jobs')
  @RequirePermissions(PERMISSIONS.SCRAPER_JOBS_TRIGGER)
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeJobs(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body() scrapeManyDto: ScrapeManyDto,
    @Req() req: Request,
  ) {
    await this.scraperService.scrapeMany(
      scrapeManyDto.ids,
      ScrapeType.JOBS,
      buildAuditContext(actor, req),
    );

    return { queued: true, message: 'Job scrapes have been queued' };
  }
}
