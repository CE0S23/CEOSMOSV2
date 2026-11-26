import { SinEspacios } from '../../common/validators/sin-espacios';
import {
  IsEmail,
  IsObject,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

// Política de contraseña segura: mínimo 8 caracteres, mayúscula, minúscula,
// número y símbolo. Se comparte entre registro y cambio de contraseña.
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const PASSWORD_MESSAGE =
  'Password must contain uppercase, lowercase, a number and a symbol';

export class RegisterDto {
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
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_MESSAGE,
  })
  @SinEspacios('password')
  password: string;
}

export class LoginDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;

  @IsString()
  @MinLength(1)
  @SinEspacios('password')
  password: string;
}

export class WebAuthnRegisterOptionsDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;
}

export class WebAuthnRegisterVerifyDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;

  @IsString()
  challenge: string;

  @IsObject()
  response: Record<string, unknown>;
}

export class WebAuthnLoginOptionsDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;
}

export class WebAuthnLoginVerifyDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;

  @IsString()
  challenge: string;

  @IsObject()
  response: Record<string, unknown>;
}

export class VerifyEmailDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @SinEspacios('code')
  code: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @SinEspacios('email')
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  @SinEspacios('token')
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_MESSAGE,
  })
  @SinEspacios('newPassword')
  newPassword: string;
}
