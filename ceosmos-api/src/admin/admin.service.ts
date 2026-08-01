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
  ChangeUserRoleDto,
} from './dto/admin-users.dto';

type Role = 'USER' | 'ADMIN';

export const ROLES_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    'admin.users.view',
    'admin.users.create',
    'admin.users.edit',
    'admin.users.deactivate',
    'admin.users.password',
    'admin.roles.assign',
    'admin.roles.view',
    'admin.audit.view',
    'auth.login',
    'profile.edit',
    'profile.password',
  ],
  USER: ['auth.login', 'profile.edit', 'profile.password'],
};

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

  async changeUserRole(targetId: string, dto: ChangeUserRoleDto, requesterId: string) {
    if (targetId === requesterId) {
      throw new BadRequestException(
        'Admins cannot change their own role via this endpoint',
      );
    }
    const target = await this.findActiveUserOrThrow(targetId);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role as any },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: (updated as any).role,
    };
  }

  getRolesPermissions(): { roles: Record<string, { label: string; permissions: string[] }> } {
    const labels: Record<Role, string> = {
      ADMIN: 'Administrador',
      USER: 'Usuario',
    };
    const roles: Record<string, { label: string; permissions: string[] }> = {};
    for (const role of Object.keys(ROLES_PERMISSIONS) as Role[]) {
      roles[role] = {
        label: labels[role],
        permissions: ROLES_PERMISSIONS[role],
      };
    }
    return { roles };
  }

  async getAuditLogs(query: {
    page?: string;
    pageSize?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, username: true } } },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items: items.map((i) => ({
        id: i.id,
        action: i.action,
        timestamp: i.timestamp,
        ipAddress: i.ipAddress,
        metadata: i.metadata,
        userId: i.userId,
        user: i.user
          ? { id: i.user.id, email: i.user.email, username: i.user.username }
          : null,
      })),
    };
  }
}
