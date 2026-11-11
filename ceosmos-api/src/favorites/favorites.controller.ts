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
    if (!CONTENT_KEY.test(value)) throw new BadRequestException('contentKey inválido');
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

  /** Idempotente: marcar dos veces deja un solo favorito. */
  @Put(':contentKey')
  async add(@Req() req: RequestWithUser, @Param('contentKey') contentKey: string) {
    const key = this.key(contentKey);
    return this.prisma.favorite.upsert({
      where: { userId_contentKey: { userId: req.user.id, contentKey: key } },
      create: { userId: req.user.id, contentKey: key },
      update: {},
      select: { contentKey: true, createdAt: true },
    });
  }

  /** Idempotente: quitar uno que no existe responde igual. */
  @Delete(':contentKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: RequestWithUser, @Param('contentKey') contentKey: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId: req.user.id, contentKey: this.key(contentKey) },
    });
  }
}
