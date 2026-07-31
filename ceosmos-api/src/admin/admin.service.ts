import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateUserStatusDto,
  UpdateUserPasswordDto,
} from './dto/admin-users.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

  private async findActiveUserOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerified: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { mediaItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      ...u,
      mediaItemsCount: u._count.mediaItems,
      _count: undefined,
    }));
  }

  async createUser(dto: CreateAdminUserDto, requesterId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new BadRequestException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        emailVerified: true,
        role: (dto.role ?? 'USER') as any,
        active: true,
        preferences: {
          create: {
            theme: 'dark',
            flowTimeDefault: 60,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: (user as any).role,
      active: (user as any).active,
    };
  }

  async updateUser(targetId: string, dto: UpdateAdminUserDto) {
    const target = await this.findActiveUserOrThrow(targetId);

    if (dto.email && dto.email !== target.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: targetId } },
      });
      if (existing) throw new BadRequestException('Email already in use');
    }

    if (dto.username && dto.username !== target.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, id: { not: targetId } },
      });
      if (existing) throw new BadRequestException('Username already taken');
    }

    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.username) data.username = dto.username;

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data,
    });

    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      role: (updated as any).role,
      active: (updated as any).active,
    };
  }

  async softDeleteUser(targetId: string, requesterId: string) {
    if (targetId === requesterId) {
      throw new BadRequestException(
        'Admins cannot delete their own account via this endpoint',
      );
    }
    const target = await this.findActiveUserOrThrow(targetId);

    await this.prisma.user.update({
      where: { id: targetId },
      data: { active: false, deletedAt: new Date() },
    });

    await this.sessionsService.deleteByUserId(targetId);

    return { message: `User ${target.email} deactivated and removed` };
  }

  async setUserStatus(targetId: string, dto: UpdateUserStatusDto) {
    const target = await this.findActiveUserOrThrow(targetId);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { active: dto.active },
    });

    if (!dto.active) {
      await this.sessionsService.deleteByUserId(targetId);
    }

    return {
      id: updated.id,
      email: updated.email,
      active: (updated as any).active,
    };
  }

  async changeUserPassword(targetId: string, dto: UpdateUserPasswordDto) {
    const target = await this.findActiveUserOrThrow(targetId);

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.sessionsService.deleteByUserId(targetId);

    return { message: `Password updated for ${target.email}` };
  }
}
