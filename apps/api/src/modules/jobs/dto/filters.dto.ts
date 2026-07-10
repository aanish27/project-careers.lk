import { PaginationDto } from '@/common/dto/pagination.dto';
import { JobStatus } from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterJobsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by company name',
    example: 'Jobswala',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    description: 'Filter by job status',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
