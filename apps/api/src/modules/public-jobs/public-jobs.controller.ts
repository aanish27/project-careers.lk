import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
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
  findAll(@Query() filters: FilterPublicJobsDto) {
    return this.publicJobsService.findAll(filters);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.publicJobsService.findBySlug(slug);
  }
}
