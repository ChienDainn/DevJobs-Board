import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const pw = process.env.APP_PASSWORD;
  if (!pw || pw.length < 6) {
    console.error('Thiếu APP_PASSWORD (tối thiểu 6 ký tự). Ví dụ: APP_PASSWORD=matkhau-cua-ban npm start');
    process.exit(1);
  }
  const app = await NestFactory.create(AppModule);
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`DevJobs API chạy tại http://localhost:${port}/api`);
}
bootstrap();
