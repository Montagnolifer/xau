import * as crypto from 'crypto';

// Só faz o polyfill se o crypto global não existir ou não tiver os métodos necessários
if (!globalThis.crypto || !globalThis.crypto.randomUUID) {
  globalThis.crypto = crypto as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/interceptors/http-exception.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3101'],
    credentials: true,
  });

  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar interceptor de exceções
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3105;
  await app.listen(port);
  console.log(`🚀 Backend rodando na porta ${port}`);
}
bootstrap();
