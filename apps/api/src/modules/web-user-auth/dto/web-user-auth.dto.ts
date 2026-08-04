import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class GoogleUpsertDto {
  @ApiProperty({
    description: "Google's stable account identifier (the `sub` claim)",
  })
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({
    description: 'Email address from the verified Google profile',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}

export class RequestEmailOtpDto {
  @ApiProperty({ description: 'Address to send the sign-in code to' })
  @IsEmail()
  email: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit sign-in code' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code: string;
}

export class WebUserDataDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true })
  companyId: number | null;
}

export class WebUserAuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: WebUserDataDto })
  user: WebUserDataDto;
}

export class WebUserRefreshResponseDto {
  @ApiProperty()
  accessToken: string;
}

export class WebUserLogoutResponseDto {
  @ApiProperty()
  success: boolean;
}

export class RequestEmailOtpResponseDto {
  @ApiProperty()
  success: boolean;
}
