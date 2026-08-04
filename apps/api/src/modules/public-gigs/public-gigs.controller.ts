import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { FilterPublicGigsDto } from './dto/filter-public-gigs.dto';
import { PublicGigsService } from './public-gigs.service';

// Unauthenticated — only ever returns approved gigs.
@Controller('public/gigs')
@Public()
export class PublicGigsController {
  constructor(private readonly publicGigsService: PublicGigsService) {}

  @Get()
  findAll(@Query() filters: FilterPublicGigsDto) {
    return this.publicGigsService.findAll(filters);
  }

  // Must be declared before ':slug' — see PublicJobsController for why.
  @Get('sitemap-entries')
  sitemapEntries() {
    return this.publicGigsService.sitemapEntries();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.publicGigsService.findBySlug(slug);
  }
}
