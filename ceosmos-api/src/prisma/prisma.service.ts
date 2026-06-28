import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    neonConfig.webSocketConstructor = ws;
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to Neon PostgreSQL (via Neon Driver Adapter)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
