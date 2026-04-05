import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP is handled by Vercel headers
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
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`CEOSMOS API running on port ${port}`);
}
bootstrap();
