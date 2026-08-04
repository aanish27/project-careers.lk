import { JobApprovalStatus, JobStatus } from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterJobsDto {
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
    description: 'Filter by job status',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({
    description: 'Filter by sector',
    example: 'IT & Software',
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: JobApprovalStatus,
    example: JobApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(JobApprovalStatus)
  approvalStatus?: JobApprovalStatus;
}
