import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFocusSessionDto } from './dto/focus-sessions.dto';

@Injectable()
export class FocusSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, limit = 50) {
    return this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Crea la sesión. Si trae clientId y ya existe una con el mismo (userId, clientId),
   * devuelve la existente en lugar de duplicarla (P11-D01: reintento tras perder la
   * respuesta). La carrera entre dos reintentos simultáneos la resuelve el índice
   * UNIQUE: el que pierde recibe P2002 y devuelve la fila ganadora.
   */
  async create(userId: string, dto: CreateFocusSessionDto) {
    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);
    if (endedAt < startedAt) {
      throw new BadRequestException('endedAt debe ser posterior a startedAt');
    }
    if (endedAt.getTime() > Date.now() + 5 * 60_000) {
      throw new BadRequestException('endedAt no puede estar en el futuro');
    }
    if (dto.durationSeconds > dto.targetMinutes * 60) {
      throw new BadRequestException(
        'durationSeconds supera la duración objetivo',
      );
    }
    if (dto.clientId) {
      const previa = await this.existente(userId, dto.clientId);
      if (previa) return previa;
    }
    try {
      return await this.prisma.focusSession.create({
        data: {
          userId,
          clientId: dto.clientId,
          contentKey: dto.contentKey,
          mode: dto.mode,
          startedAt,
          endedAt,
          durationSeconds: dto.durationSeconds,
          targetMinutes: dto.targetMinutes,
          completed: dto.completed,
          metadata: (dto.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });
    } catch (e) {
      if (
        dto.clientId &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const ganadora = await this.existente(userId, dto.clientId);
        if (ganadora) return ganadora;
      }
      throw e;
    }
  }

  private existente(userId: string, clientId: string) {
    return this.prisma.focusSession.findUnique({
      where: { userId_clientId: { userId, clientId } },
    });
  }
}
