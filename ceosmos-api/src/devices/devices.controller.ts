import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

/** Dispositivos vinculados (wearable por TCP/IP o BLE) del usuario autenticado. */
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() req: RequestWithUser) {
    return this.prisma.linkedDevice.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateDeviceDto) {
    try {
      return await this.prisma.linkedDevice.create({
        data: {
          userId: req.user.id,
          name: dto.name.trim(),
          type: dto.type,
          transport: dto.transport,
          address: dto.address,
          configuration: dto.configuration as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ese dispositivo ya está vinculado.');
      }
      throw e;
    }
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    // El filtro por userId evita modificar dispositivos ajenos (404, no 403).
    const result = await this.prisma.linkedDevice.updateMany({
      where: { id, userId: req.user.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.configuration !== undefined && {
          configuration: dto.configuration as Prisma.InputJsonValue,
        }),
        ...(dto.seen && { lastSeenAt: new Date() }),
      },
    });
    if (result.count === 0) throw new NotFoundException('Dispositivo no encontrado');
    return this.prisma.linkedDevice.findUnique({ where: { id } });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.prisma.linkedDevice.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (result.count === 0) throw new NotFoundException('Dispositivo no encontrado');
  }
}
