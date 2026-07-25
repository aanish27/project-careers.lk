import type { PermissionKey } from '@careerslk/lib';
import type { Role as SharedRole } from '@careerslk/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'campaign_manager' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'slug must be lowercase alphanumeric with underscores, starting with a letter',
  })
  slug: string;

  @ApiProperty({ example: 'Campaign Manager' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: [Number],
    description:
      'Permission ids to grant. You can only grant permissions you hold.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class SetRolePermissionsDto {
  @ApiProperty({
    type: [Number],
    description:
      'The complete permission set for this role — this REPLACES the current ' +
      'set rather than adding to it. Send an empty array to revoke everything.',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permissionIds: number[];
}

interface RoleWithPermissions {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionAssignments: { permission: { key: string } }[];
}

export class RoleResponseDto implements SharedRole {
  @ApiProperty() id: number;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty() isSystem: boolean;
  @ApiProperty({ type: [String] }) permissions: PermissionKey[];
  @ApiProperty() userCount?: number;

  static from(role: RoleWithPermissions, userCount?: number): RoleResponseDto {
    return {
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissionAssignments.map(
        (assignment) => assignment.permission.key as PermissionKey,
      ),
      ...(userCount !== undefined ? { userCount } : {}),
    };
  }
}
