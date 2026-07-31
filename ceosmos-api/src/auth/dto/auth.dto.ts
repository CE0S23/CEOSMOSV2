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
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_MESSAGE,
  })
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class WebAuthnRegisterOptionsDto {
  @IsEmail()
  email: string;
}

export class WebAuthnRegisterVerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  challenge: string;

  @IsObject()
  response: Record<string, unknown>;
}

export class WebAuthnLoginOptionsDto {
  @IsEmail()
  email: string;
}

export class WebAuthnLoginVerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  challenge: string;

  @IsObject()
  response: Record<string, unknown>;
}

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_MESSAGE,
  })
  newPassword: string;
}
