import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @ApiPropertyOptional({
    description: 'Cursor pointing to the next page (opaque string)',
    example: 'eyJpZCI6IjEyMyJ9',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Cursor pointing to the previous page (opaque string)',
    example: 'eyJpZCI6IjEwMCJ9',
  })
  @IsOptional()
  @IsString()
  prevCursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
