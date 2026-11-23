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
      algorithms: ['HS256'], // Blindaje: no acepta HS384/HS512 ni 'none'
      secretOrKey: jwtSecret(), // falla al arrancar si no hay secreto válido (P11-D06)
    });
  }

  /**
   * Se ejecuta en CADA petición autenticada. Antes hacía dos consultas (sesión por
   * token y luego usuario por id); P12-O1 las une en una sola con JOIN, de modo que
   * cada petición cuesta un viaje menos a PostgreSQL y una deserialización menos de
   * Prisma. Además exige que la sesión pertenezca al usuario del JWT y ya no carga
   * `passwordHash` en `req.user` (ningún controlador lo usa).
   */
  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    // Blindaje: una carga útil con otra forma es un token inválido (401), no un 500.
    if (
      typeof payload?.userId !== 'string' ||
      typeof payload?.sessionToken !== 'string'
    ) {
      throw new UnauthorizedException('Invalid token');
    }
    const hashedToken = createHash('sha256')
      .update(payload.sessionToken)
      .digest('hex');

    const filas = await this.prisma.$queryRaw<FilaSesionUsuario[]>`
      SELECT s."expiresAt" AS "sessionExpiresAt",
             u.id, u.email, u.username, u."emailVerified", u.role::text AS role, u.active,
             u."failedLoginAttempts", u."lockedUntil", u."createdAt", u."updatedAt", u."deletedAt"
      FROM "Session" s
      JOIN "User" u ON u.id = s."userId"
      WHERE s.token = ${hashedToken} AND s."userId" = ${payload.userId}
      LIMIT 1`;
    const fila = filas[0];

    // Misma semántica que antes: sesión inexistente o vencida → 401.
    if (!fila || fila.sessionExpiresAt < new Date()) {
      throw new UnauthorizedException('Session not found or expired');
    }

    const { sessionExpiresAt: _vence, ...user } = fila;
    return user;
  }
}

/** Usuario que queda en `req.user` (sin el hash de la contraseña). */
export type UsuarioAutenticado = Omit<User, 'passwordHash'>;
type FilaSesionUsuario = UsuarioAutenticado & { sessionExpiresAt: Date };
