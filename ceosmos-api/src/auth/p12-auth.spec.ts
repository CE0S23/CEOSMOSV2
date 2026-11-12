// Práctica 12 (CEOSMOS Móvil) · Optimización y concurrencia en la autenticación.
//  - P12-O1: JwtStrategy.validate hace UNA consulta (sesión + usuario con JOIN).
//  - P12-D01: el contador de inicios de sesión fallidos se incrementa en una sola sentencia.
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

const textoSql = (llamada: unknown[]) => (llamada[0] as TemplateStringsArray).join('?');

describe('JwtStrategy.validate (P12-O1: una sola consulta por petición)', () => {
  const OLD = process.env.JWT_SECRET;
  beforeAll(() => (process.env.JWT_SECRET = 'x'.repeat(40)));
  afterAll(() => (process.env.JWT_SECRET = OLD));

  const prisma = {
    $queryRaw: jest.fn(),
    session: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const estrategia = () => new JwtStrategy(prisma as any);
  const futuro = new Date(Date.now() + 60_000);
  beforeEach(() => jest.clearAllMocks());

  it('sesión vigente: devuelve el usuario sin passwordHash y sin consultar Session/User por separado', async () => {
    prisma.$queryRaw.mockResolvedValue([{ sessionExpiresAt: futuro, id: 'u1', email: 'a@b.c', role: 'USER' }]);
    const user = await estrategia().validate({ userId: 'u1', sessionToken: 'tok' });
    expect(user).toEqual({ id: 'u1', email: 'a@b.c', role: 'USER' });
    expect(user).not.toHaveProperty('passwordHash');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.session.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    const sql = textoSql(prisma.$queryRaw.mock.calls[0]);
    expect(sql).toMatch(/JOIN "User" u ON u\.id = s\."userId"/);
    expect(sql).not.toMatch(/passwordHash/);
    // token (hash SHA-256) y userId viajan como parámetros, no concatenados
    expect(prisma.$queryRaw.mock.calls[0].slice(1)).toEqual([expect.stringMatching(/^[0-9a-f]{64}$/), 'u1']);
  });

  it('sesión inexistente o de otro usuario (0 filas) → 401', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(estrategia().validate({ userId: 'u1', sessionToken: 'tok' })).rejects.toThrow(UnauthorizedException);
  });

  it('sesión vencida → 401', async () => {
    prisma.$queryRaw.mockResolvedValue([{ sessionExpiresAt: new Date(Date.now() - 1000), id: 'u1' }]);
    await expect(estrategia().validate({ userId: 'u1', sessionToken: 'tok' })).rejects.toThrow('Session not found or expired');
  });
});

describe('AuthService.login: intentos fallidos simultáneos (P12-D01)', () => {
  const usuario = { id: 'u1', email: 'a@b.c', passwordHash: 'hash', active: true, emailVerified: true, lockedUntil: null, failedLoginAttempts: 0 };
  const prisma = { user: { findUnique: jest.fn(), update: jest.fn() }, $queryRaw: jest.fn() };
  const servicio = () => new AuthService(prisma as any, {} as any, {} as any, {} as any);
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue(usuario);
  });

  it('el incremento y el bloqueo se hacen en UNA sentencia UPDATE … RETURNING (sin leer-y-escribir)', async () => {
    prisma.$queryRaw.mockResolvedValue([{ failedLoginAttempts: 3 }]);
    await expect(servicio().login({ email: 'a@b.c', password: 'mala' } as any, {} as any)).rejects.toThrow('2 attempt(s) remaining');
    expect(prisma.user.update).not.toHaveBeenCalled();
    const sql = textoSql(prisma.$queryRaw.mock.calls[0]);
    expect(sql).toMatch(/"failedLoginAttempts" = CASE WHEN "failedLoginAttempts" \+ 1 >= \?/);
    expect(sql).toMatch(/RETURNING "failedLoginAttempts"/);
  });

  it('si el UPDATE deja el contador en 0, este intento bloqueó la cuenta', async () => {
    prisma.$queryRaw.mockResolvedValue([{ failedLoginAttempts: 0 }]);
    await expect(servicio().login({ email: 'a@b.c', password: 'mala' } as any, {} as any)).rejects.toThrow('Account locked for 15 minutes');
  });
});
