import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterAuditLogsDto {
  @ApiPropertyOptional({ description: 'Filter by actor admin user id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actorUserId?: number;

  @ApiPropertyOptional({
    description: 'Filter by the type of entity acted upon',
    example: 'company',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by the recorded action',
    example: 'company.created',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by the affected entity id' })
  @IsOptional()
  @IsString()
  entityId?: string;

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
