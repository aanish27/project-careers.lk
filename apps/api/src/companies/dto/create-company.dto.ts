import { CompanyStatus } from '@careerslk/database';
import { PaginationType } from '@careerslk/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Jobswala',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL to the company logo',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  logoUrl: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://example.com',
  })
  @IsUrl()
  websiteUrl: string;

  @ApiProperty({
    description: 'Company website careers page URL',
    example: 'https://example.com/careers',
  })
  @IsUrl()
  careerUrl: string;

  @ApiProperty({
    description: 'Current status of the company',
    enum: CompanyStatus,
    example: CompanyStatus.ACTIVE,
  })
  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @ApiProperty({
    description: 'CSS selector used to locate job listings on the careers page',
    example: '.job-listing',
    required: false,
  })
  @IsString()
  @IsOptional()
  htmlSelector: string;

  @ApiProperty({
    description: 'CSS selector for the pagination/load-more button',
    example: '.pagination-next',
    required: false,
  })
  @IsString()
  @IsOptional()
  paginationBtn: string;

  @ApiProperty({
    description: 'Pagination strategy used on the careers page',
    enum: PaginationType,
    example: PaginationType.NEXT_BUTTON,
    required: false,
  })
  @IsEnum(PaginationType)
  @IsOptional()
  paginationType: PaginationType;

  @ApiProperty({
    description: 'Applicant tracking system (ATS) platform used by the company',
    example: 'greenhouse',
    required: false,
  })
  @IsString()
  @IsOptional()
  atsPlatform: string;
}
