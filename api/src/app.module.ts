import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { OnlineModule } from './online/online.module';
import { Job } from './jobs/job.entity';

function dbOptions(): TypeOrmModuleOptions {
  if (process.env.DATABASE_URL) {
    console.log('Lưu trữ: Postgres');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // Render/Neon/Supabase cần SSL; tắt bằng PGSSL=disable khi chạy Postgres local
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
      entities: [Job],
      synchronize: true, // app cá nhân nhỏ: tự tạo/cập nhật bảng. Dự án lớn nên chuyển sang migrations.
    };
  }
  const location = process.env.DATA_FILE || 'data.sqlite';
  console.log(`Lưu trữ: SQLite (${location}) - chỉ dùng khi chạy local, hãy đặt DATABASE_URL khi deploy`);
  return { type: 'sqljs', location, autoSave: true, entities: [Job], synchronize: true };
}

@Controller()
class HealthController {
  @Get('healthz')
  health() {
    return 'ok';
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    TypeOrmModule.forRoot(dbOptions()),
    AuthModule,
    JobsModule,
    OnlineModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
