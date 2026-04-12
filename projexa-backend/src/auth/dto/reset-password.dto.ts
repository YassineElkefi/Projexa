import { IsString, MinLength, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID('4')
  token: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
