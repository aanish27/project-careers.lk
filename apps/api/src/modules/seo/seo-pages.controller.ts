import { Public } from '@/common/decorators/public.decorator';
import { SeoPageType } from '@careerslk/types';
import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SeoPagesService } from './seo-pages.service';

// Slugs contain slashes (e.g. "jobs/software-engineer/in/colombo"), so the
// lookup takes it as a query param rather than a path param — avoids
// Express/path-to-regexp's handling of encoded slashes in path segments.
@Controller('seo-pages')
@Public()
export class SeoPagesController {
  constructor(private readonly seoPagesService: SeoPagesService) {}

  @Get()
  list(@Query('pageType') pageType?: SeoPageType) {
    return this.seoPagesService.list(pageType);
  }

  @Get('by-slug')
  async findBySlug(@Query('slug') slug: string) {
    const result = await this.seoPagesService.findBySlug(slug);
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
