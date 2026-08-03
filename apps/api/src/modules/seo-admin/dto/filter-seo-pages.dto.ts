import { SeoPageType } from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class FilterSeoPagesDto {
  @ApiPropertyOptional({ enum: SeoPageType })
  @IsOptional()
  @IsEnum(SeoPageType)
  pageType?: SeoPageType;

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
