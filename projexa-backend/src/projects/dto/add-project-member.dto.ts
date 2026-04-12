import { IsEmail, IsInt, IsOptional, ValidateIf } from 'class-validator';

export class AddProjectMemberDto {
  @ValidateIf(o => !o.email)
  @IsInt()
  userId?: number;

  @ValidateIf(o => o.userId == null)
  @IsEmail()
  email?: string;
}
