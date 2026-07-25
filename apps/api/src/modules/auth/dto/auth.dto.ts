import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PermissionKey } from '@careerslk/types';

export class LoginDto {
  @ApiProperty({
    description: 'Email address for authentication',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&._-#)',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'firstName can only contain letters, spaces, hyphens and apostrophes',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'lastName can only contain letters, spaces, hyphens and apostrophes',
  })
  lastName: string;
}

export class UserDataDto {
  @ApiProperty({ description: 'User unique identifier', example: 1 })
  id: number;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: 'Role slugs',
    type: [String],
    example: ['admin'],
  })
  roles: string[];

  @ApiProperty({ description: 'Effective permission keys', type: [String] })
  permissions: PermissionKey[];

  @ApiProperty({ description: 'Whether the user holds the super admin role' })
  isSuperAdmin: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserDataDto,
  })
  user: UserDataDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success status',
    example: true,
  })
  success: boolean;
}
