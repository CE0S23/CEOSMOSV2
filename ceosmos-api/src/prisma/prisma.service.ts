import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

/** Neon (serverless por WebSocket) en producción; PostgreSQL normal en desarrollo. */
export function isNeonUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith('.neon.tech');
  } catch {
    return false;
  }
}

function clientOptions(): Prisma.PrismaClientOptions {
  const connectionString = process.env.DATABASE_URL;
  if (!isNeonUrl(connectionString)) {
    // Base PostgreSQL local de desarrollo: motor TCP estándar de Prisma.
    return {};
  }
  neonConfig.webSocketConstructor = ws;
  return { adapter: new PrismaNeon(new Pool({ connectionString })) };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super(clientOptions());
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(
      isNeonUrl(process.env.DATABASE_URL)
        ? 'Prisma connected to Neon PostgreSQL (via Neon Driver Adapter)'
        : 'Prisma connected to PostgreSQL (local development database)',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
