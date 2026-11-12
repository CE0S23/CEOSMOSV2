// Práctica 11 (CEOSMOS Móvil) · White Box de MediaService (biblioteca multimedia)
// Versión corregida: addMedia corre en una transacción con bloqueo por usuario
// (P11-D07), los duplicados responden 409 (P11-D05) y deleteMedia filtra por dueño.
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService (white box)', () => {
  const tx = {
    $queryRaw: jest.fn(),
    mediaItem: { count: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    mediaItem: { findMany: jest.fn(), deleteMany: jest.fn() },
  };
  const s = new MediaService(prisma as any);
  beforeEach(() => {
    jest.clearAllMocks();
    tx.mediaItem.count.mockResolvedValue(0);
    tx.mediaItem.findFirst.mockResolvedValue(null);
    tx.mediaItem.create.mockResolvedValue({ id: 'm1' });
  });

  it('P11-D07 el alta toma el bloqueo del usuario dentro de la transacción antes de validar', async () => {
    await s.addMedia('u1', { type: 'IMAGE', url: 'https://x/a.jpg' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const [sql, ...valores] = tx.$queryRaw.mock.calls[0];
    expect(sql.join('?')).toContain('pg_advisory_xact_lock(hashtext(?))');
    expect(valores).toEqual(['u1']); // parámetro enlazado, no concatenado
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.mediaItem.count.mock.invocationCallOrder[0],
    );
  });

  it('Límite: 99 elementos → se crea; 100 → 400', async () => {
    tx.mediaItem.count.mockResolvedValueOnce(99);
    await expect(
      s.addMedia('u1', { type: 'IMAGE', url: 'https://x/a.jpg' }),
    ).resolves.toEqual({ id: 'm1' });
    tx.mediaItem.count.mockResolvedValueOnce(100);
    await expect(
      s.addMedia('u1', { type: 'IMAGE', url: 'https://x/b.jpg' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('P11-D05 YouTube duplicado → 409 Conflict', async () => {
    tx.mediaItem.findFirst.mockResolvedValueOnce({ id: 'm0' });
    await expect(
      s.addMedia('u1', { type: 'YOUTUBE', externalId: 'abc' }),
    ).rejects.toThrow(ConflictException);
    expect(tx.mediaItem.findFirst.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      externalId: 'abc',
    });
  });

  it('P11-D05 imagen duplicada → 409 Conflict', async () => {
    tx.mediaItem.findFirst.mockResolvedValueOnce({ id: 'm0' });
    await expect(s.addMedia('u1', { type: 'IMAGE', url: 'u' })).rejects.toThrow(
      ConflictException,
    );
    expect(tx.mediaItem.findFirst.mock.calls[0][0].where).toEqual({
      userId: 'u1',
      url: 'u',
    });
  });

  it('getUserMedia filtra por usuario y, si se envía, por tipo', async () => {
    prisma.mediaItem.findMany.mockResolvedValue([]);
    await s.getUserMedia('u1', {});
    await s.getUserMedia('u1', { type: 'IMAGE' });
    expect(prisma.mediaItem.findMany.mock.calls[0][0].where).toEqual({
      userId: 'u1',
    });
    expect(prisma.mediaItem.findMany.mock.calls[1][0].where).toEqual({
      userId: 'u1',
      type: 'IMAGE',
    });
  });

  it('deleteMedia: inexistente o ajeno → 404 (filtra por dueño); propio → sin cuerpo', async () => {
    prisma.mediaItem.deleteMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    await expect(s.deleteMedia('u1', 'x')).rejects.toThrow(NotFoundException);
    await expect(s.deleteMedia('u1', 'x')).resolves.toBeUndefined();
    expect(prisma.mediaItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 'x', userId: 'u1' },
    });
  });
});
