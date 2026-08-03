import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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
