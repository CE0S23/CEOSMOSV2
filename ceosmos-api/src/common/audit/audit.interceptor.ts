import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService, AuditAction } from './audit-log.service';
import { AUDIT_ACTION_KEY } from './audit.decorator';
import type { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<AuditAction>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!action) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request & { user?: { id?: string }; auditUserId?: string }>();

    return next.handle().pipe(
      tap(() => {
        const userId = req.user?.id ?? req.auditUserId ?? null;
        const metadata = {
          method: req.method,
          path: req.route?.path ?? req.originalUrl,
          targetId: (req.params as Record<string, string>)?.id ?? null,
        };
        this.auditLogService.log(action, userId, req, metadata);
      }),
    );
  }
}
