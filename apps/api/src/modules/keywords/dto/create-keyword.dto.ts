import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateKeywordDto {
  @ApiProperty({
    description: 'Keyword name',
    example: 'React',
  })
  @IsString()
  name: string;
}
