import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { FilterPublicJobsDto } from './dto/filter-public-jobs.dto';
import { PublicJobsService } from './public-jobs.service';

// Unauthenticated — consumed server-side by the Next.js public site.
// `isStaleSlug` is returned as data rather than an HTTP redirect here: this
// API is called server-side during page render, so an HTTP redirect at this
// layer wouldn't reach the browser. The actual 308 to the canonical slug is
// issued by the Next.js page component (Phase 4) once it sees the flag.
@Controller('public/jobs')
@Public()
export class PublicJobsController {
  constructor(private readonly publicJobsService: PublicJobsService) {}

  @Get()
  findAll(@Req() req: Request, @Query() filters: FilterPublicJobsDto) {
    console.log(filters.slug);
    return this.publicJobsService.findAll(filters);
  }

  // Must be declared before ':slug' — NestJS matches routes in declaration
  // order, and 'sitemap-entries' would otherwise be captured as a slug.
  @Get('sitemap-entries')
  sitemapEntries() {
    return this.publicJobsService.sitemapEntries();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    console.log(slug);
    return this.publicJobsService.findBySlug(slug);
  }

  // Lightweight check for the proxy (FR-SEO-10's 410) — avoids fetching the
  // full job/related-jobs payload just to check one boolean.
  @Get(':slug/retirement-status')
  async retirementStatus(@Param('slug') slug: string) {
    return { retired: await this.publicJobsService.isRetired(slug) };
  }
}
