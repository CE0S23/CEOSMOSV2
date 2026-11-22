import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CreateMediaDto } from './media/dto/media.dto';
import { JwtStrategy } from './auth/jwt.strategy';

// Blindaje · regresiones del Red Box ampliado (scripts/redbox_ampliado.sh en la app).
describe('Blindaje de la API', () => {
  const OLD = process.env.JWT_SECRET;
  beforeAll(() => (process.env.JWT_SECRET = 'x'.repeat(40)));
  afterAll(() => (process.env.JWT_SECRET = OLD));

  function responder(exception: unknown) {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host: any = { switchToHttp: () => ({ getResponse: () => res }) };
    new HttpExceptionFilter().catch(exception, host);
    return res;
  }

  it('JSON anidado que desborda la pila → 400, no 500', () => {
    let e: unknown;
    const f = (n: number): number => f(n + 1);
    try {
      f(0);
    } catch (err) {
      e = err;
    }
    expect(responder(e).status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('un token firmado con otra forma de carga útil → 401, no 500', async () => {
    const s = new JwtStrategy({} as any);
    await expect(s.validate({ sub: 'x' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each(['javascript:alert(1)', 'data:text/html,hola', 'http://inseguro.example/a.png', 'https://a.example/' + 'a'.repeat(3000)])(
    'medio IMAGE rechaza url peligrosa o enorme %#',
    async (url) => {
      const dto = plainToInstance(CreateMediaDto, { type: 'IMAGE', url });
      expect((await validate(dto)).length).toBeGreaterThan(0);
    },
  );

  it('medio IMAGE acepta una url https', async () => {
    const dto = plainToInstance(CreateMediaDto, { type: 'IMAGE', url: 'https://img.example/a.png' });
    expect(await validate(dto)).toHaveLength(0);
  });
});