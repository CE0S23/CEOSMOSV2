import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto, GetMediaQueryDto } from './dto/media.dto';

export const MEDIA_MAX_POR_USUARIO = 100;

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserMedia(userId: string, query: GetMediaQueryDto) {
    return this.prisma.mediaItem.findMany({
      where: {
        userId,
        ...(query.type && { type: query.type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * P11-D07: el límite de 100 y la verificación de duplicados eran "leer y luego
   * escribir" sin protección. Ahora todo ocurre en una transacción que toma un
   * bloqueo por usuario (pg_advisory_xact_lock), así dos altas simultáneas del
   * mismo usuario se ejecutan una después de la otra. Consulta parametrizada.
   * P11-D05: un duplicado es un conflicto → 409.
   */
  async addMedia(userId: string, data: CreateMediaDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;

      const totalItems = await tx.mediaItem.count({ where: { userId } });
      if (totalItems >= MEDIA_MAX_POR_USUARIO) {
        throw new BadRequestException(
          'Maximum limit of 100 media items reached',
        );
      }

      const existing = await tx.mediaItem.findFirst({
        where:
          data.type === 'YOUTUBE'
            ? { userId, externalId: data.externalId }
            : { userId, url: data.url },
      });
      if (existing) {
        throw new ConflictException(
          data.type === 'YOUTUBE'
            ? 'This YouTube video is already saved'
            : 'This image URL is already saved',
        );
      }

      return tx.mediaItem.create({
        data: {
          userId,
          type: data.type,
          externalId: data.externalId,
          url: data.url,
          title: data.title,
          thumbnail: data.thumbnail,
        },
      });
    });
  }

  /**
   * Borra filtrando por dueño en la misma consulta. Un elemento ajeno responde 404
   * (igual que /devices) para no revelar que existe (P11-D05).
   */
  async deleteMedia(userId: string, mediaId: string): Promise<void> {
    const { count } = await this.prisma.mediaItem.deleteMany({
      where: { id: mediaId, userId },
    });
    if (count === 0) throw new NotFoundException('Media item not found');
  }
}
