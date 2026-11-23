import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Formato único de error: { statusCode, message, error } (P11-D05).
 * Antes solo se capturaba HttpException; los errores de body-parser (413, JSON
 * inválido) y los no controlados salían con otro formato. Ahora todo pasa por aquí
 * y los errores inesperados se registran en el log sin exponer detalles al cliente.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      message =
        typeof r === 'object' && r !== null && 'message' in r
          ? r.message
          : exception.message;
    } else if (esErrorDeCuerpo(exception)) {
      // body-parser: 413 entity.too.large, 400 entity.parse.failed, etc.
      status = exception.status;
      message =
        exception.status === 413
          ? 'Request body too large'
          : 'Invalid request body';
    } else if (
      exception instanceof RangeError &&
      /call stack/i.test(exception.message)
    ) {
      // Blindaje: JSON anidado miles de niveles desbordaba la pila al validar (500).
      status = HttpStatus.BAD_REQUEST;
      message = 'Request body too deeply nested';
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status] ?? 'Error',
    });
  }
}

function esErrorDeCuerpo(e: unknown): e is { status: number; type: string } {
  if (typeof e !== 'object' || e === null) return false;
  const { type, status } = e as { type?: unknown; status?: unknown };
  return (
    typeof type === 'string' &&
    typeof status === 'number' &&
    status >= 400 &&
    status < 500
  );
}
