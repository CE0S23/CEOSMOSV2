import { SinEspacios } from '../../common/validators/sin-espacios';
import { IsString, IsNumber, Min, Max, IsIn, IsOptional, MinLength, MaxLength, IsEmail } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['dark', 'light'])
  theme?: string;

  @IsOptional()
  @IsNumber()
  @Min(5) // la app móvil ofrece sesiones de 5 minutos
  @Max(180)
  flowTimeDefault?: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @SinEspacios('username')
  username?: string;
}

export class AdminUpdateUserDto {
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
