import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { MailService } from '../mail/mail.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  RegisterDto,
  LoginDto,
  WebAuthnRegisterVerifyDto,
  WebAuthnLoginVerifyDto,
} from './dto/auth.dto';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rpID: string;
  private readonly rpName: string;
  private readonly expectedOrigin: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly mailService: MailService,
  ) {
    this.rpID = process.env.RP_ID ?? 'localhost';
    this.rpName = process.env.RP_NAME ?? 'CEOSMOS';
    this.expectedOrigin =
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200';
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    console.log(`[AuthService] Registering user with email: ${dto.email}`);
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      // Unverified account with same email: resend code instead of rejecting
      if (existing.email === dto.email && !existing.emailVerified) {
        await this.resendVerification(dto.email);
        return { message: 'Verification email resent. Check your inbox.' };
      }
      console.error(`[AuthService] Registration failed: Email or username already in use (${dto.email}, ${dto.username})`);
      throw new BadRequestException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        emailVerified: false,
        preferences: {
          create: {
            theme: 'dark',
            flowTimeDefault: 60,
          },
        },
      },
    });

    const rawCode = randomBytes(3).toString('hex').toUpperCase();
    const hashedCode = createHash('sha256').update(rawCode).digest('hex');

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        code: hashedCode,
        type: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    try {
      await this.mailService.sendVerificationEmail(user.email, rawCode);
    } catch (mailError) {
      console.error('[AuthService] Mail failed during register, continuing', mailError);
    }

    console.log(`[AuthService] User registered successfully: ${user.email}`);

    return { message: 'User created. Check your email for the verification code.' };
  }

  async login(
    dto: LoginDto,
    req: Request,
  ): Promise<{ accessToken: string }> {
    console.log(`[AuthService] Login attempt for email: ${dto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      console.error(`[AuthService] Login failed: Invalid credentials for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Account is disabled. Contact an administrator.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    if (!user.emailVerified) {
      console.error(`[AuthService] Login failed: Email not verified for ${dto.email}`);
      throw new UnauthorizedException('Email not verified');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      console.error(`[AuthService] Login failed: Password mismatch for ${dto.email}`);
      const newFailedCount = user.failedLoginAttempts + 1;
      const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : newFailedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : user.lockedUntil,
        },
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          `Account locked for 15 minutes due to ${MAX_FAILED_ATTEMPTS} failed attempts.`,
        );
      }

      const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedCount;
      throw new UnauthorizedException(
        `Invalid credentials. ${attemptsLeft} attempt(s) remaining before lock.`,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    (req as any).auditUserId = user.id;

    console.log(`[AuthService] User logged in successfully: ${dto.email}`);
    return this.buildJwtSession(user.id, req);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.sessionsService.deleteByUserId(userId);
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(
    email: string,
    rawCode: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const hashedCode = createHash('sha256').update(rawCode).digest('hex');

    const token = await this.prisma.emailToken.findFirst({
      where: {
        userId: user.id,
        type: 'VERIFY_EMAIL',
        code: hashedCode,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) throw new BadRequestException('Invalid or expired code');

    await this.prisma.$transaction([
      this.prisma.emailToken.update({
        where: { id: token.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokensCount = await this.prisma.emailToken.count({
      where: {
        userId: user.id,
        type: 'VERIFY_EMAIL',
        createdAt: { gt: oneHourAgo },
      },
    });

    if (recentTokensCount >= 3) {
      throw new BadRequestException('Rate limit exceeded: max 3 requests per hour');
    }

    await this.prisma.emailToken.updateMany({
      where: { userId: user.id, type: 'VERIFY_EMAIL', used: false },
      data: { used: true },
    });

    const rawCode = randomBytes(3).toString('hex').toUpperCase();
    const hashedCode = createHash('sha256').update(rawCode).digest('hex');

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        code: hashedCode,
        type: 'VERIFY_EMAIL',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    try {
      await this.mailService.sendVerificationEmail(user.email, rawCode);
    } catch (mailError) {
      console.error('[AuthService] Mail failed during resendVerification, continuing', mailError);
    }

    return { message: 'Verification code resent successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const rawToken = `${randomUUID()}-${Date.now()}`;
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.emailToken.updateMany({
      where: { userId: user.id, type: 'RESET_PASSWORD', used: false },
      data: { used: true },
    });

    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        code: hashedToken,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, rawToken);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    
    const tokenRecord = await this.prisma.emailToken.findFirst({
      where: {
        code: hashedToken,
        type: 'RESET_PASSWORD',
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.emailToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    await this.sessionsService.deleteByUserId(tokenRecord.userId);

    return { message: 'Password reset successfully' };
  }

  async generateWebAuthnRegisterOptions(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const existingPasskeys = await this.prisma.passkey.findMany({
      where: { userId: user.id },
    });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new Uint8Array(Buffer.from(user.id, 'utf-8')),
      userName: user.email,
      excludeCredentials: existingPasskeys.map((p) => ({
        id: p.credentialId,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    return options;
  }

  async verifyWebAuthnRegister(dto: WebAuthnRegisterVerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('User not found');

    this.logger.log(`[WebAuthn Register] rpID: "${this.rpID}"`);
    this.logger.log(`[WebAuthn Register] expectedOrigin: "${this.expectedOrigin}"`);
    this.logger.log(`[WebAuthn Register] challenge: "${dto.challenge}"`);
    this.logger.log(`[WebAuthn Register] response.id: "${(dto.response as any)?.id}"`);

    let verification: any;
    try {
      verification = await verifyRegistrationResponse({
        response: dto.response as any,
        expectedChallenge: dto.challenge,
        expectedOrigin: this.expectedOrigin,
        expectedRPID: this.rpID,
        requireUserVerification: false,
      });
      this.logger.log(`[WebAuthn Register] verified: ${verification.verified}`);
    } catch (error: any) {
      this.logger.error(`[WebAuthn Register] verifyRegistrationResponse threw: ${error.message}`);
      throw error;
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('WebAuthn registration verification failed');
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    await this.prisma.passkey.create({
      data: {
        credentialId: credential.id,
        userId: user.id,
        webAuthnUserId: Buffer.from(user.id, 'utf-8').toString('base64url'),
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: (dto.response as any)?.response?.transports ?? [],
      },
    });

    return { verified: true };
  }

  async generateWebAuthnLoginOptions(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const passkeys = await this.prisma.passkey.findMany({
      where: { userId: user.id },
    });

    if (passkeys.length === 0) {
      throw new BadRequestException('No passkeys registered for this user');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: passkeys.map((p) => ({
        id: p.credentialId,
        type: 'public-key' as const,
      })),
      userVerification: 'preferred',
    });

    return options;
  }

  async verifyWebAuthnLogin(dto: WebAuthnLoginVerifyDto, req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('User not found');

    const credentialId = (dto.response as any).id as string;
    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId },
    });

    if (!passkey || passkey.userId !== user.id) {
      throw new UnauthorizedException('Invalid credential');
    }

    const verification = await verifyAuthenticationResponse({
      response: dto.response as any,
      expectedChallenge: dto.challenge,
      expectedOrigin: this.expectedOrigin,
      expectedRPID: this.rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as any,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      throw new UnauthorizedException('WebAuthn authentication failed');
    }

    await this.prisma.passkey.update({
      where: { credentialId: passkey.credentialId },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    return this.buildJwtSession(user.id, req);
  }

  private async buildJwtSession(
    userId: string,
    req: Request,
  ): Promise<{ accessToken: string }> {
    const rawToken = await this.sessionsService.createSession(userId, req);
    const accessToken = this.jwtService.sign({ userId, sessionToken: rawToken });
    return { accessToken };
  }
}
