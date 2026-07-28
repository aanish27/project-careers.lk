import { ScrapeType } from '@careerslk/types';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ScrapeManyDto } from './dto/scraper.dto';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('companies/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeCompany(@Param('id', ParseIntPipe) id: number) {
    await this.scraperService.scrapeOne(id, ScrapeType.COMPANY);

    return { queued: true, message: 'Company scrape has been queued' };
  }

  @Post('companies')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeCompanies(@Body() scrapeManyDto: ScrapeManyDto) {
    await this.scraperService.scrapeMany(scrapeManyDto.ids, ScrapeType.COMPANY);

    return { queued: true, message: 'Company scrapes have been queued' };
  }

  @Post('jobs/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeJob(@Param('id', ParseIntPipe) id: number) {
    await this.scraperService.scrapeOne(id, ScrapeType.JOBS);

    return { queued: true, message: 'Job scrape has been queued' };
  }

  @Post('jobs')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeJobs(@Body() scrapeManyDto: ScrapeManyDto) {
    await this.scraperService.scrapeMany(scrapeManyDto.ids, ScrapeType.JOBS);

    return { queued: true, message: 'Job scrapes have been queued' };
  }
}
