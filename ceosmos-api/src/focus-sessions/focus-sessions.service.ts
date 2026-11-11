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
      throw new BadRequestException('durationSeconds supera la duración objetivo');
    }
    return this.prisma.focusSession.create({
      data: {
        userId,
        contentKey: dto.contentKey,
        mode: dto.mode,
        startedAt,
        endedAt,
        durationSeconds: dto.durationSeconds,
        targetMinutes: dto.targetMinutes,
        completed: dto.completed,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
