import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])/;
const PASSWORD_MESSAGE =
  'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&._-#)';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jane.smith@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({ description: 'User first name', example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Role ids to assign on creation',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds?: number[];
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'User first name', example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Smith' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Account active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetUserRolesDto {
  @ApiProperty({
    type: [Number],
    description:
      'The complete role set for this user — replaces the current set',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds: number[];
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'New password', example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
