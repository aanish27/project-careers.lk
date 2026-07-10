import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AssignJobKeywordDto {
  @ApiProperty({
    description:
      'Keyword name to attach to the job (created if it does not exist yet)',
    example: 'React',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Whether this keyword assignment was made/edited by an admin',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  editedByAdmin?: boolean;
}
