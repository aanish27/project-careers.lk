import { ScrapeLogStatus, ScrapeLogTrigger } from '@careerslk/database';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class FilterScrapeLogsDto {
  @ApiPropertyOptional({
    description: 'Filter by scrape log status',
    enum: ScrapeLogStatus,
    example: ScrapeLogStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(ScrapeLogStatus)
  status?: ScrapeLogStatus;

  @ApiPropertyOptional({
    description: 'Filter by company name',
    example: 'Jobswala',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Filter by company id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  companyId?: number;

  @ApiPropertyOptional({
    description: 'Filter by what triggered the scrape',
    enum: ScrapeLogTrigger,
    example: ScrapeLogTrigger.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(ScrapeLogTrigger)
  triggeredBy?: ScrapeLogTrigger;

  @ApiPropertyOptional({
    description: 'Filter logs created on or after this date',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter logs created on or before this date',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
