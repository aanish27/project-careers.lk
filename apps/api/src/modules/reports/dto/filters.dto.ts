import {
  AbuseReportCategory,
  AbuseReportEntityType,
  AbuseReportStatus,
} from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterReportsDto {
  @ApiPropertyOptional({
    description: 'Filter by report status',
    enum: AbuseReportStatus,
    example: AbuseReportStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(AbuseReportStatus)
  status?: AbuseReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by reported entity type',
    enum: AbuseReportEntityType,
  })
  @IsOptional()
  @IsEnum(AbuseReportEntityType)
  entityType?: AbuseReportEntityType;

  @ApiPropertyOptional({
    description: 'Filter by report category',
    enum: AbuseReportCategory,
  })
  @IsOptional()
  @IsEnum(AbuseReportCategory)
  category?: AbuseReportCategory;
}
