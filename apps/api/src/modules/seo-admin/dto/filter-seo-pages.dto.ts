import { SeoPageType } from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterSeoPagesDto {
  @ApiPropertyOptional({ enum: SeoPageType })
  @IsOptional()
  @IsEnum(SeoPageType)
  pageType?: SeoPageType;

  // Comma-separated list of SeoPageType values — backs the sidebar's
  // Public/Jobs/Freelance category views, which each span several page
  // types rather than a single one (see admin/seo/page.tsx).
  @ApiPropertyOptional({
    description: 'Comma-separated list of page types',
    example: 'ROLE,ROLE_LOCATION',
  })
  @IsOptional()
  @IsString()
  pageTypes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  needsReview?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  manualOverride?: boolean;
}
