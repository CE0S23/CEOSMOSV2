// Práctica 11 (CEOSMOS Móvil) · White Box de DevicesController y FavoritesController
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DevicesController } from './devices.controller';
import { CreateDeviceDto } from './dto/devices.dto';
import { FavoritesController } from '../favorites/favorites.controller';

const req = { user: { id: 'u1' } } as any;
const nuevo: CreateDeviceDto = {
  name: '  CEOSMOS Band ',
  type: 'WEARABLE',
  transport: 'TCP',
  address: '10.0.2.2:5050',
};

describe('DevicesController (white box)', () => {
  const prisma = {
    linkedDevice: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const c = new DevicesController(prisma as any);
  beforeEach(() => jest.clearAllMocks());

  it('create camino feliz: recorta el nombre y usa el userId del token', async () => {
    prisma.linkedDevice.create.mockResolvedValue({ id: 'd1' });
    await c.create(req, nuevo);
    expect(prisma.linkedDevice.create.mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      name: 'CEOSMOS Band',
    });
  });

  it('create: violación UNIQUE (P2002) → 409 Conflict', async () => {
    prisma.linkedDevice.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    await expect(c.create(req, nuevo)).rejects.toThrow(ConflictException);
  });

  it('create: otro error de Prisma se propaga (→ 500 controlado por Nest)', async () => {
    prisma.linkedDevice.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK', {
        code: 'P2003',
        clientVersion: '5.22.0',
      }),
    );
    await expect(c.create(req, nuevo)).rejects.toThrow(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it('update: dispositivo ajeno o inexistente (count 0) → 404, no 403', async () => {
    prisma.linkedDevice.updateMany.mockResolvedValue({ count: 0 });
    await expect(c.update(req, 'id', { seen: true })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.linkedDevice.updateMany.mock.calls[0][0].where).toEqual({
      id: 'id',
      userId: 'u1',
    });
  });

  it('update: solo escribe los campos enviados (seen → lastSeenAt)', async () => {
    prisma.linkedDevice.updateMany.mockResolvedValue({ count: 1 });
    prisma.linkedDevice.findUnique.mockResolvedValue({ id: 'id' });
    await c.update(req, 'id', { seen: true });
    const data = prisma.linkedDevice.updateMany.mock.calls[0][0].data;
    expect(Object.keys(data)).toEqual(['lastSeenAt']);
    await c.update(req, 'id', {
      name: ' Nueva ',
      address: '1.2.3.4:80',
      configuration: { a: 1 },
    });
    expect(prisma.linkedDevice.updateMany.mock.calls[1][0].data).toEqual({
      name: 'Nueva',
      address: '1.2.3.4:80',
      configuration: { a: 1 },
    });
  });

  it('remove: count 0 → 404; count 1 → sin cuerpo (204)', async () => {
    prisma.linkedDevice.deleteMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    await expect(c.remove(req, 'id')).rejects.toThrow(NotFoundException);
    await expect(c.remove(req, 'id')).resolves.toBeUndefined();
  });

  it('list: solo dispositivos del usuario autenticado', async () => {
    prisma.linkedDevice.findMany.mockResolvedValue([]);
    await c.list(req);
    expect(prisma.linkedDevice.findMany.mock.calls[0][0].where).toEqual({
      userId: 'u1',
    });
  });
});

describe('CreateDeviceDto · DEVICE_ADDRESS (valores límite)', () => {
  const ok = async (address: string) =>
    (await validate(plainToInstance(CreateDeviceDto, { ...nuevo, address })))
      .length === 0;
  it.each([
    ['10.0.2.2:5050', true],
    ['banda.local:80', true],
    ['AA:BB:CC:DD:EE:FF', true],
    ['10.0.2.2:5', false],
    ['10.0.2.2:123456', false],
    ['10.0.2.2', false],
    ['AA:BB:CC:DD:EE', false],
    ['host:80; DROP TABLE', false],
    ['', false],
  ])('%s → %s', async (a, esperado) => expect(await ok(a)).toBe(esperado));
  it('name: 0 y 41 caracteres se rechazan; 1 y 40 se aceptan', async () => {
    const n = async (name: string) =>
      (await validate(plainToInstance(CreateDeviceDto, { ...nuevo, name })))
        .length;
    expect(await n('')).toBeGreaterThan(0);
    expect(await n('a'.repeat(41))).toBeGreaterThan(0);
    expect(await n('a')).toBe(0);
    expect(await n('a'.repeat(40))).toBe(0);
  });
});

describe('FavoritesController (white box)', () => {
  const prisma = {
    favorite: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const c = new FavoritesController(prisma as any);
  beforeEach(() => jest.clearAllMocks());

  it('key inválida → 400 sin tocar la BD', async () => {
    await expect(c.add(req, "orbit' OR '1'='1")).rejects.toThrow(
      BadRequestException,
    );
    await expect(c.remove(req, 'a'.repeat(81))).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.favorite.upsert).not.toHaveBeenCalled();
    expect(prisma.favorite.deleteMany).not.toHaveBeenCalled();
  });
  it('add es idempotente (upsert por userId+contentKey)', async () => {
    prisma.favorite.upsert.mockResolvedValue({ contentKey: 'media:1' });
    await c.add(req, 'media:1');
    expect(prisma.favorite.upsert.mock.calls[0][0].where).toEqual({
      userId_contentKey: { userId: 'u1', contentKey: 'media:1' },
    });
  });
  it('P11-D02 upsert simultáneo que pierde la carrera (P2002) devuelve el favorito, no 500', async () => {
    prisma.favorite.upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    prisma.favorite.findUniqueOrThrow.mockResolvedValueOnce({
      contentKey: 'orbit',
    });
    await expect(c.add(req, 'orbit')).resolves.toEqual({ contentKey: 'orbit' });
  });
  it('P11-D02 otros errores de Prisma se siguen propagando', async () => {
    prisma.favorite.upsert.mockRejectedValueOnce(new Error('conexión perdida'));
    await expect(c.add(req, 'orbit')).rejects.toThrow('conexión perdida');
  });
  it('remove de un favorito inexistente responde igual (deleteMany)', async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 0 });
    await expect(c.remove(req, 'orbit')).resolves.toBeUndefined();
  });
  it('list filtra por usuario y solo selecciona contentKey y createdAt', async () => {
    prisma.favorite.findMany.mockResolvedValue([]);
    await c.list(req);
    expect(prisma.favorite.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 'u1' },
      select: { contentKey: true, createdAt: true },
    });
  });
});
