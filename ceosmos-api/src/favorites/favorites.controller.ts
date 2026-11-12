import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CONTENT_KEY } from '../focus-sessions/dto/focus-sessions.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

/** Favoritos del usuario: claves del catálogo incluido o "media:<id>". */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  private key(value: string) {
    if (!CONTENT_KEY.test(value))
      throw new BadRequestException('contentKey inválido');
    return value;
  }

  @Get()
  async list(@Req() req: RequestWithUser) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { contentKey: true, createdAt: true },
    });
    return rows;
  }

  /**
   * Idempotente: marcar dos veces deja un solo favorito. El upsert de Prisma hace
   * SELECT y luego INSERT; con peticiones simultáneas dos pueden intentar el INSERT
   * y la perdedora recibe P2002. Antes eso salía como 500 (P11-D02); ahora se
   * devuelve el favorito que ganó.
   */
  @Put(':contentKey')
  async add(
    @Req() req: RequestWithUser,
    @Param('contentKey') contentKey: string,
  ) {
    const key = this.key(contentKey);
    const where = {
      userId_contentKey: { userId: req.user.id, contentKey: key },
    };
    const select = { contentKey: true, createdAt: true };
    try {
      return await this.prisma.favorite.upsert({
        where,
        create: { userId: req.user.id, contentKey: key },
        update: {},
        select,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return this.prisma.favorite.findUniqueOrThrow({ where, select });
      }
      throw e;
    }
  }

  /** Idempotente: quitar uno que no existe responde igual. */
  @Delete(':contentKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: RequestWithUser,
    @Param('contentKey') contentKey: string,
  ) {
    await this.prisma.favorite.deleteMany({
      where: { userId: req.user.id, contentKey: this.key(contentKey) },
    });
  }
}
