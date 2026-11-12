// Práctica 11 · Correcciones P11-D05 (formato de error único) y P11-D06 (secreto JWT).
import { ConflictException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { jwtSecret } from '../../auth/jwt-secret';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

function capturar(excepcion: unknown) {
  const res: any = { status: jest.fn(() => res), json: jest.fn() };
  const host: any = { switchToHttp: () => ({ getResponse: () => res }) };
  new HttpExceptionFilter().catch(excepcion, host);
  return {
    status: res.status.mock.calls[0][0],
    body: res.json.mock.calls[0][0],
  };
}

describe('HttpExceptionFilter (P11-D05)', () => {
  it('HttpException conserva código y mensaje', () => {
    expect(capturar(new ConflictException('ya existe'))).toEqual({
      status: 409,
      body: { statusCode: 409, message: 'ya existe', error: 'CONFLICT' },
    });
  });
  it('413 de body-parser ahora tiene el mismo formato (antes faltaba "error")', () => {
    const e = Object.assign(new Error('request entity too large'), {
      status: 413,
      type: 'entity.too.large',
    });
    expect(capturar(e)).toEqual({
      status: 413,
      body: {
        statusCode: 413,
        message: 'Request body too large',
        error: 'PAYLOAD_TOO_LARGE',
      },
    });
  });
  it('JSON mal formado de body-parser → 400 uniforme', () => {
    const e = Object.assign(new SyntaxError('Unexpected end'), {
      status: 400,
      type: 'entity.parse.failed',
    });
    expect(capturar(e).body).toEqual({
      statusCode: 400,
      message: 'Invalid request body',
      error: 'BAD_REQUEST',
    });
  });
  it('Error inesperado → 500 genérico, se registra en el log y no expone el detalle', () => {
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const r = capturar(
      new Error('PrismaClientKnownRequestError: Unique constraint failed'),
    );
    expect(r).toEqual({
      status: 500,
      body: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'INTERNAL_SERVER_ERROR',
      },
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('JwtAuthGuard.handleRequest (P11-D05)', () => {
  it('no devuelve el mensaje interno de passport-jwt', () => {
    expect(() => new JwtAuthGuard().handleRequest(null, false)).toThrow(
      'Unauthorized',
    );
  });
});

describe('jwtSecret (P11-D06)', () => {
  it('sin JWT_SECRET la API no arranca', () => {
    expect(() => jwtSecret({})).toThrow('JWT_SECRET');
  });
  it('rechaza "changeme" y secretos de menos de 32 caracteres', () => {
    expect(() => jwtSecret({ JWT_SECRET: 'changeme' })).toThrow();
    expect(() => jwtSecret({ JWT_SECRET: 'x'.repeat(31) })).toThrow();
  });
  it('acepta un secreto de 32 o más caracteres', () => {
    expect(jwtSecret({ JWT_SECRET: 'x'.repeat(32) })).toHaveLength(32);
  });
});
