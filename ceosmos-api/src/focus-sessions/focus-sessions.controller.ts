import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FocusSessionsService } from './focus-sessions.service';
import {
  CreateFocusSessionDto,
  ListFocusSessionsQueryDto,
} from './dto/focus-sessions.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

/** Historial de sesiones de enfoque del usuario autenticado (app móvil). */
@Controller('focus-sessions')
@UseGuards(JwtAuthGuard)
export class FocusSessionsController {
  constructor(private readonly service: FocusSessionsService) {}

  @Get()
  list(@Req() req: RequestWithUser, @Query() query: ListFocusSessionsQueryDto) {
    return this.service.list(req.user.id, query.limit, query.cursor);
  }

  /** P12-O1: número de sesiones y segundos totales, calculados en la base. */
  @Get('resumen')
  resumen(@Req() req: RequestWithUser) {
    return this.service.resumen(req.user.id);
  }

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateFocusSessionDto) {
    return this.service.create(req.user.id, dto);
  }
}
