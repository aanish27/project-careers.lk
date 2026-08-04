import { FreelanceApprovalStatus } from '@careerslk/types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class FilterFreelanceProfilesDto {
  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: FreelanceApprovalStatus,
    example: FreelanceApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(FreelanceApprovalStatus)
  approvalStatus?: FreelanceApprovalStatus;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by owning web user id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  webUserId?: number;
}
