import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { PublicCompaniesService } from './public-companies.service';

@Controller('public/companies')
@Public()
export class PublicCompaniesController {
  constructor(
    private readonly publicCompaniesService: PublicCompaniesService,
  ) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.publicCompaniesService.findBySlug(slug);
  }

  @Get(':slug/jobs')
  findJobsBySlug(@Param('slug') slug: string) {
    return this.publicCompaniesService.findJobsBySlug(slug);
  }
}
