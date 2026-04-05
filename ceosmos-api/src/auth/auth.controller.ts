import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  WebAuthnRegisterOptionsDto,
  WebAuthnRegisterVerifyDto,
  WebAuthnLoginOptionsDto,
  WebAuthnLoginVerifyDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(dto, req);
    res.cookie('Authentication', session.accessToken, COOKIE_OPTIONS);
    return { success: true, token: session.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout((req as any).user.id);
    res.clearCookie('Authentication');
    return { success: true };
  }

  @Post('webauthn/register/options')
  @HttpCode(HttpStatus.OK)
  async webAuthnRegisterOptions(@Body() dto: WebAuthnRegisterOptionsDto) {
    return this.authService.generateWebAuthnRegisterOptions(dto.email);
  }

  @Post('webauthn/register/verify')
  @HttpCode(HttpStatus.OK)
  async webAuthnRegisterVerify(@Body() dto: WebAuthnRegisterVerifyDto) {
    return this.authService.verifyWebAuthnRegister(dto);
  }

  @Post('webauthn/login/options')
  @HttpCode(HttpStatus.OK)
  async webAuthnLoginOptions(@Body() dto: WebAuthnLoginOptionsDto) {
    return this.authService.generateWebAuthnLoginOptions(dto.email);
  }

  @Post('webauthn/login/verify')
  @HttpCode(HttpStatus.OK)
  async webAuthnLoginVerify(
    @Body() dto: WebAuthnLoginVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.verifyWebAuthnLogin(dto, req);
    res.cookie('Authentication', session.accessToken, COOKIE_OPTIONS);
    return { success: true, token: session.accessToken };
  }
}
