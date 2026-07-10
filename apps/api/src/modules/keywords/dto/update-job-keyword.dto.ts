import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateJobKeywordDto {
  @ApiProperty({
    description: 'Whether this keyword assignment was made/edited by an admin',
    example: true,
  })
  @IsBoolean()
  editedByAdmin: boolean;
}
