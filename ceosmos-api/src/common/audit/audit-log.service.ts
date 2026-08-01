import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_DELETE'
  | 'ROLE_CHANGE';

export const AUDIT_ACTIONS: AuditAction[] = [
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
  'USER_CREATE',
  'USER_DELETE',
  'ROLE_CHANGE',
];

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve la IP real de la request considerando proxies (X-Forwarded-For).
   */
  getClientIp(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
      if (first) return first;
    }
    return req.ip ?? null;
  }

  async log(
    action: AuditAction,
    userId: string | null,
    req?: Request,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ipAddress: this.getClientIp(req),
          metadata: (metadata ?? null) as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log (${action}): ${(error as Error).message}`);
    }
  }

  async query(filters: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: AuditAction;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = new Date(filters.from);
      if (filters.to) where.timestamp.lte = new Date(filters.to);
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
