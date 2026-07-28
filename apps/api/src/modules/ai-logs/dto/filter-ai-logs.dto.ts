import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterAiLogsDto {
  @ApiPropertyOptional({ description: 'Filter by company id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  companyId?: number;

  @ApiPropertyOptional({ description: 'Filter by scrape log id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  scrapeLogId?: number;

  @ApiPropertyOptional({
    description: 'Filter by call status',
    example: 'succeeded',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by model name',
    example: 'claude-haiku-4-5-20251001',
  })
  @IsOptional()
  @IsString()
  model?: string;

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
