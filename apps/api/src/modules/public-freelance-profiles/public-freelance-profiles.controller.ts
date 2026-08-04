import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { FilterPublicFreelanceProfilesDto } from './dto/filter-public-freelance-profiles.dto';
import { PublicFreelanceProfilesService } from './public-freelance-profiles.service';

// Unauthenticated — only ever returns approved profiles.
@Controller('public/freelance-profiles')
@Public()
export class PublicFreelanceProfilesController {
  constructor(
    private readonly publicFreelanceProfilesService: PublicFreelanceProfilesService,
  ) {}

  @Get()
  findAll(@Query() filters: FilterPublicFreelanceProfilesDto) {
    return this.publicFreelanceProfilesService.findAll(filters);
  }

  // Must be declared before ':slug' — see PublicJobsController for why.
  @Get('sitemap-entries')
  sitemapEntries() {
    return this.publicFreelanceProfilesService.sitemapEntries();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.publicFreelanceProfilesService.findBySlug(slug);
  }
}
