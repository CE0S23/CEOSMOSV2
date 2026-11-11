import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { TasksModule } from './tasks/tasks.module';
import { SessionsModule } from './sessions/sessions.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './common/audit/audit.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { SearchModule } from './search/search.module';
import { FocusSessionsModule } from './focus-sessions/focus-sessions.module';
import { FavoritesModule } from './favorites/favorites.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      // Límite general por IP. Las rutas de /auth conservan el límite estricto de
      // 10/min (AuthController); un cliente móvil hace varias lecturas al abrir.
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    SessionsModule,
    MailModule,
    AuthModule,
    UsersModule,
    MediaModule,
    TasksModule,
    AdminModule,
    AuditModule,
    SearchModule,
    FocusSessionsModule,
    FavoritesModule,
    DevicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
