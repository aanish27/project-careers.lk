import { Public } from '@/common/decorators/public.decorator';
import { AppType, SeoPageType } from '@careerslk/types';
import { Controller, Get, NotFoundException, Query, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { SeoPagesService } from './seo-pages.service';

// Slugs contain slashes (e.g. "jobs/software-engineer/in/colombo"), so the
// lookup takes it as a query param rather than a path param — avoids
// Express/path-to-regexp's handling of encoded slashes in path segments.
//
// SkipThrottle: unauthenticated, read-only, and hit on every pSEO page's SSR
// render — the global 10req/60s default (app.module.ts) exists for
// sensitive/mutating endpoints, not this.
@Controller('seo-pages')
@Public()
@SkipThrottle()
export class SeoPagesController {
  constructor(private readonly seoPagesService: SeoPagesService) {}

  @Get('public')
  getPublic(@Query('appType') appType: AppType) {
    return this.seoPagesService.getPublic(appType);
  }

  @Get()
  list(@Query('pageType') pageType?: SeoPageType) {
    return this.seoPagesService.list(pageType);
  }

  @Get('by-slug')
  async findBySlug(@Req() req: Request, @Query('slug') slug: string) {
    const result = await this.seoPagesService.findBySlug(slug);
    if (!result) throw new NotFoundException('SEO page not found');
    return result;
  }

  @Get('seo')
  async getSeoContent(@Req() req: Request, @Query('slug') slug: string) {
    const result = await this.seoPagesService.getSeoContent(slug);
    if (!result) throw new NotFoundException('SEO page not found');
    return result;
  }

  // Lightweight check for the proxy (FR-SEO-10's 410) — avoids fetching the
  // full page/jobs/relatedLinks payload just to check one boolean.
  @Get('retirement-status')
  async retirementStatus(@Query('slug') slug: string) {
    return { retired: await this.seoPagesService.isRetired(slug) };
  }
}
