import { ScrapeType } from '@careerslk/types';
import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ScrapeManyDto } from './dto/scraper.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('companies/:id')
  scrapeCompany(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.scrapeOne(id, ScrapeType.COMPANY);
  }

  @Post('companies')
  scrapeCompanies(@Body() scrapeManyDto: ScrapeManyDto) {
    return this.scraperService.scrapeMany(
      scrapeManyDto.ids,
      ScrapeType.COMPANY,
    );
  }

  @Post('jobs/:id')
  scrapeJob(@Param('id', ParseIntPipe) id: number) {
    return this.scraperService.scrapeOne(id, ScrapeType.JOBS);
  }

  @Post('jobs')
  scrapeJobs(@Body() scrapeManyDto: ScrapeManyDto) {
    return this.scraperService.scrapeMany(scrapeManyDto.ids, ScrapeType.JOBS);
  }
}
