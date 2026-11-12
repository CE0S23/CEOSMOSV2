import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFocusSessionDto } from './dto/focus-sessions.dto';

/** Campos del historial que muestra la app (P12-O1: sin `userId` ni `createdAt`). */
export const CAMPOS_HISTORIAL = {
  id: true,
  clientId: true,
  contentKey: true,
  mode: true,
  startedAt: true,
  endedAt: true,
  durationSeconds: true,
  targetMinutes: true,
  completed: true,
  metadata: true,
} satisfies Prisma.FocusSessionSelect;

@Injectable()
export class FocusSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Historial paginado por cursor (P12-O1). Devuelve solo los campos que usan los
   * clientes (sin `userId` ni `createdAt`) y, si llega `cursor` (id de la última sesión
   * de la página anterior), continúa justo después usando el índice
   * (userId, startedAt): no hay OFFSET, así que la página 400 cuesta lo mismo que la 1.
   * El `id` desempata sesiones con el mismo `startedAt`.
   */
  async list(userId: string, limit = 50, cursor?: string) {
    let despues: Prisma.FocusSessionWhereInput = {};
    if (cursor) {
      // El cursor solo vale si es una sesión del mismo usuario.
      const ref = await this.prisma.focusSession.findFirst({
        where: { id: cursor, userId },
        select: { startedAt: true },
      });
      if (!ref) return [];
      // Keyset: `startedAt <= ref` es un RANGO del índice (userId, startedAt); el OR
      // solo desempata dentro del mismo instante. (El `cursor` nativo de Prisma genera un
      // OR sin ese rango y recorría el índice desde el principio: 4.2 ms en la sesión
      // 19 000 frente a ~0.1 ms así; ver fase4_db.)
      despues = {
        startedAt: { lte: ref.startedAt },
        OR: [{ startedAt: { lt: ref.startedAt } }, { id: { lt: cursor } }],
      };
    }
    return this.prisma.focusSession.findMany({
      where: { userId, ...despues },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: CAMPOS_HISTORIAL,
    });
  }

  /**
   * Totales del usuario calculados en PostgreSQL (P12-O1). Antes la app sumaba los
   * minutos recorriendo el historial descargado, que solo trae la primera página.
   */
  async resumen(userId: string) {
    const r = await this.prisma.focusSession.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { durationSeconds: true },
    });
    return {
      sesiones: r._count._all,
      segundos: r._sum.durationSeconds ?? 0,
    };
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
