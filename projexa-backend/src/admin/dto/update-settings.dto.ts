import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Role } from '../../users/enums/role.enum';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsBoolean()
  allowRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsEnum([Role.MEMBER, Role.TEAM_LEAD])
  defaultUserRole?: Role.MEMBER | Role.TEAM_LEAD;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxProjectsPerTeam?: number;

  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;
}