import { SinEspacios } from '../../common/validators/sin-espacios';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export const ADMIN_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const ADMIN_PASSWORD_MESSAGE =
  'Password must contain uppercase, lowercase, a number and a symbol';

export class CreateAdminUserDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @SinEspacios('username')
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(ADMIN_PASSWORD_PATTERN, {
    message: ADMIN_PASSWORD_MESSAGE,
  })
  @SinEspacios('password')
  password: string;

  @IsOptional()
  @IsEnum(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN';
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEmail()
  @SinEspacios('email')
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @SinEspacios('username')
  username?: string;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  active: boolean;
}

export class UpdateUserPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(ADMIN_PASSWORD_PATTERN, {
    message: ADMIN_PASSWORD_MESSAGE,
  })
  @SinEspacios('newPassword')
  newPassword: string;
}

export class ChangeUserRoleDto {
  @IsEnum(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'USER_CREATE', 'USER_DELETE', 'ROLE_CHANGE'])
  action?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
