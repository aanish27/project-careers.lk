import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsInt } from 'class-validator';

export class ScrapeManyDto {
  @ApiProperty({
    description: 'Array of Ids of the type content to scrape',
    example: '[1,2,12]',
    type: [Number],
  })
  @IsInt({ each: true })
  @ArrayNotEmpty({ each: true })
  ids: number[];
}
