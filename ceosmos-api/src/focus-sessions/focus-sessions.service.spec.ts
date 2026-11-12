// Práctica 11 (CEOSMOS Móvil) · White Box de FocusSessionsService.create
// Grafo: D1 endedAt < startedAt → 400 · D2 endedAt > ahora+5min → 400 ·
//        D3 durationSeconds > targetMinutes*60 → 400 · camino feliz → prisma.create
// V(G) = 3 + 1 = 4 caminos independientes.
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FocusSessionsService } from './focus-sessions.service';
import {
  CreateFocusSessionDto,
  ListFocusSessionsQueryDto,
} from './dto/focus-sessions.dto';

const ahora = new Date('2026-11-11T18:00:00.000Z');
const iso = (msDesdeAhora: number) =>
  new Date(ahora.getTime() + msDesdeAhora).toISOString();

function dto(
  cambios: Partial<CreateFocusSessionDto> = {},
): CreateFocusSessionDto {
  return {
    contentKey: 'orbit',
    mode: 'FOCUS',
    startedAt: iso(-10 * 60_000),
    endedAt: iso(-5 * 60_000),
    durationSeconds: 300,
    targetMinutes: 5,
    completed: true,
    ...cambios,
  };
}

describe('FocusSessionsService (white box)', () => {
  const prisma = {
    focusSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const service = new FocusSessionsService(prisma as any);

  beforeAll(() => jest.useFakeTimers().setSystemTime(ahora));
  afterAll(() => jest.useRealTimers());
  beforeEach(() => jest.clearAllMocks());

  it('CB1 D1=V: endedAt anterior a startedAt → 400 y no escribe en la BD', async () => {
    await expect(
      service.create('u1', dto({ endedAt: iso(-11 * 60_000) })),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.focusSession.create).not.toHaveBeenCalled();
  });

  it('CB2 D2=V: endedAt más de 5 min en el futuro → 400', async () => {
    await expect(
      service.create('u1', dto({ endedAt: iso(5 * 60_000 + 1) })),
    ).rejects.toThrow('futuro');
  });

  it('CB3 D3=V: duración mayor que el objetivo → 400', async () => {
    await expect(
      service.create('u1', dto({ durationSeconds: 301 })),
    ).rejects.toThrow('supera');
  });

  it('CB4 camino feliz: crea con userId del token y metadata JSONB', async () => {
    prisma.focusSession.create.mockResolvedValue({ id: 'fs1' });
    const metadata = { wearable: { samples: 3, avgHeartRate: 72.1 } };
    await expect(service.create('u1', dto({ metadata }))).resolves.toEqual({
      id: 'fs1',
    });
    const data = prisma.focusSession.create.mock.calls[0][0].data;
    expect(data.userId).toBe('u1');
    expect(data.metadata).toEqual(metadata);
    expect(data.startedAt).toBeInstanceOf(Date);
  });

  it('Límites: endedAt == startedAt, endedAt == ahora+5min y duración == objetivo se aceptan', async () => {
    prisma.focusSession.create.mockResolvedValue({ id: 'ok' });
    await service.create(
      'u1',
      dto({ startedAt: iso(-1000), endedAt: iso(-1000), durationSeconds: 0 }),
    );
    await service.create('u1', dto({ endedAt: iso(5 * 60_000) }));
    await service.create('u1', dto({ durationSeconds: 300, targetMinutes: 5 }));
    expect(prisma.focusSession.create).toHaveBeenCalledTimes(3);
  });

  // ---- Corrección P11-D01: idempotencia por clientId ----
  const CID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
  it('D01 reintento con el mismo clientId devuelve la sesión existente y NO crea otra', async () => {
    prisma.focusSession.findUnique.mockResolvedValueOnce({
      id: 'fs-original',
      clientId: CID,
    });
    await expect(service.create('u1', dto({ clientId: CID }))).resolves.toEqual(
      { id: 'fs-original', clientId: CID },
    );
    expect(prisma.focusSession.create).not.toHaveBeenCalled();
    expect(prisma.focusSession.findUnique.mock.calls[0][0].where).toEqual({
      userId_clientId: { userId: 'u1', clientId: CID },
    });
  });
  it('D01 primer envío con clientId: lo guarda en la fila', async () => {
    prisma.focusSession.findUnique.mockResolvedValueOnce(null);
    prisma.focusSession.create.mockResolvedValue({ id: 'fs-nueva' });
    await service.create('u1', dto({ clientId: CID }));
    expect(prisma.focusSession.create.mock.calls[0][0].data.clientId).toBe(CID);
  });
  it('D01 carrera: dos reintentos simultáneos → el perdedor recibe P2002 y devuelve la ganadora', async () => {
    prisma.focusSession.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'fs-ganadora' });
    prisma.focusSession.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    await expect(service.create('u1', dto({ clientId: CID }))).resolves.toEqual(
      { id: 'fs-ganadora' },
    );
  });
  it('D01 sin clientId (clientes anteriores) se comporta como antes; P2002 sin clientId se propaga', async () => {
    prisma.focusSession.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    await expect(service.create('u1', dto())).rejects.toThrow(
      Prisma.PrismaClientKnownRequestError,
    );
    expect(prisma.focusSession.findUnique).not.toHaveBeenCalled();
  });

  it('list: límite por defecto 50, ordenado por startedAt desc y filtrado por usuario', async () => {
    prisma.focusSession.findMany.mockResolvedValue([]);
    await service.list('u1');
    expect(prisma.focusSession.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  });
});

describe('CreateFocusSessionDto / ListFocusSessionsQueryDto (validación de entrada)', () => {
  const errores = async (cls: any, obj: object) =>
    (await validate(plainToInstance(cls, obj) as object)).map(
      (e) => e.property,
    );

  it('Acepta un cuerpo válido', async () => {
    expect(await errores(CreateFocusSessionDto, dto())).toEqual([]);
  });
  it.each([
    ['contentKey con espacios', { contentKey: 'a b' }, 'contentKey'],
    [
      'contentKey de 81 caracteres',
      { contentKey: 'a'.repeat(81) },
      'contentKey',
    ],
    [
      'contentKey con comilla (inyección)',
      { contentKey: "x' OR 1=1--" },
      'contentKey',
    ],
    ['modo desconocido', { mode: 'SLEEP' }, 'mode'],
    ['fecha no ISO', { startedAt: '11/11/2026' }, 'startedAt'],
    [
      'targetMinutes 4 (límite inferior - 1)',
      { targetMinutes: 4 },
      'targetMinutes',
    ],
    [
      'targetMinutes 181 (límite superior + 1)',
      { targetMinutes: 181 },
      'targetMinutes',
    ],
    ['durationSeconds negativo', { durationSeconds: -1 }, 'durationSeconds'],
    ['durationSeconds decimal', { durationSeconds: 1.5 }, 'durationSeconds'],
    ['metadata no objeto', { metadata: 'x' }, 'metadata'],
    [
      'metadata de más de 4 KB (P11-D04)',
      { metadata: { muestras: Array(2000).fill(72) } },
      'metadata',
    ],
    [
      'clientId que no es UUID v4 (P11-D01)',
      { clientId: 'reintento-1' },
      'clientId',
    ],
  ])('Rechaza %s', async (_n, cambio, campo) => {
    expect(await errores(CreateFocusSessionDto, dto(cambio as any))).toContain(
      campo,
    );
  });
  it('P11-D04 límite de metadata: 4096 bytes se acepta, 4097 se rechaza', async () => {
    const con = (n: number) => ({ metadata: { x: 'a'.repeat(n - 8) } }); // {"x":""} = 8 bytes
    expect(await errores(CreateFocusSessionDto, dto(con(4096)))).toEqual([]);
    expect(await errores(CreateFocusSessionDto, dto(con(4097)))).toContain(
      'metadata',
    );
  });
  it('Límites válidos de targetMinutes: 5 y 180', async () => {
    expect(
      await errores(CreateFocusSessionDto, dto({ targetMinutes: 5 })),
    ).toEqual([]);
    expect(
      await errores(
        CreateFocusSessionDto,
        dto({ targetMinutes: 180, durationSeconds: 0 }),
      ),
    ).toEqual([]);
  });
  it('limit de la consulta: 0 y 101 se rechazan; 1 y 100 se aceptan', async () => {
    expect(await errores(ListFocusSessionsQueryDto, { limit: '0' })).toContain(
      'limit',
    );
    expect(
      await errores(ListFocusSessionsQueryDto, { limit: '101' }),
    ).toContain('limit');
    expect(await errores(ListFocusSessionsQueryDto, { limit: '1' })).toEqual(
      [],
    );
    expect(await errores(ListFocusSessionsQueryDto, { limit: '100' })).toEqual(
      [],
    );
  });
});
