import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { csrfMiddleware, CSRF_HEADER } from './common/csrf/csrf.middleware';

/**
 * Crea y configura la aplicación sin ponerla a escuchar.
 * La usan main.ts (servidor normal) y api/index.js (función serverless de Vercel).
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Detrás del proxy de Vercel/Railway: req.ip debe ser la IP real del cliente,
  // si no el ThrottlerGuard contaría a todos los usuarios como una sola IP.
  app.set('trust proxy', true);

  app.use(
    helmet({
      // Blindaje: la API solo devuelve JSON; nada se puede cargar ni enmarcar.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );
  app.use(cookieParser());
  app.use(csrfMiddleware);

  console.log('FRONTEND_ORIGIN:', process.env.FRONTEND_ORIGIN);

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_ORIGIN,
        'http://localhost:4200',
        'https://ceosmos-t8ee.vercel.app',
      ].filter(Boolean);

      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        // Blindaje: sin cabeceras CORS el navegador bloquea; antes respondía 500.
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', CSRF_HEADER],
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  return app;
}
