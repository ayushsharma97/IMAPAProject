import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error','warn','log'] });
  app.enableCors();
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}/api`);
}
bootstrap();
