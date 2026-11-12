import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { jwtSecret } from './jwt-secret';

interface JwtPayload {
  userId: string;
  sessionToken: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => request?.cookies?.Authentication ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(), // falla al arrancar si no hay secreto válido (P11-D06)
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const hashedToken = createHash('sha256')
      .update(payload.sessionToken)
      .digest('hex');

    const session = await this.prisma.session.findUnique({
      where: { token: hashedToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session not found or expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
