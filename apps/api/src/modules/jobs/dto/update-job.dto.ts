import { EmploymentType, JobStatus } from '@careerslk/types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateJobDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Job location',
    example: 'Colombo, Sri Lanka',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Work mode',
    example: 'remote',
    required: false,
  })
  @IsString()
  @IsOptional()
  workMode?: string;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    required: false,
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiProperty({
    description: 'Role category',
    example: 'engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleCategory?: string;

  @ApiProperty({
    description: 'Department',
    example: 'Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: 'Minimum salary',
    example: 150000,
    required: false,
  })
  @IsInt()
  @IsOptional()
  salaryMin?: number;

  @ApiProperty({
    description: 'Maximum salary',
    example: 250000,
    required: false,
  })
  @IsInt()
  @IsOptional()
  salaryMax?: number;

  @ApiProperty({
    description: 'Salary currency',
    example: 'LKR',
    required: false,
  })
  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @ApiProperty({
    description: 'Raw salary text as scraped from the source',
    example: 'LKR 150,000 - 250,000 per month',
    required: false,
  })
  @IsString()
  @IsOptional()
  salaryRaw?: string;

  @ApiProperty({
    description: 'Job description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Application deadline',
    example: '2026-08-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({
    description: 'URL to apply for the job',
    example: 'https://example.com/careers/apply/123',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  applyUrl?: string;

  @ApiProperty({
    description: 'Current status of the job',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
    required: false,
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
