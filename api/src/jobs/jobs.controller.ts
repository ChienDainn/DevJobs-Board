import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateJobDto, MoveJobDto, UpdateJobDto } from './jobs.dto';
import { JobsService } from './jobs.service';

@UseGuards(AuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list() {
    return this.jobs.list();
  }

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobs.create(dto);
  }

  /** Nạp lại các job Facebook mẫu (bỏ qua job đã có) */
  @Post('seed')
  @HttpCode(200)
  async seed() {
    return { imported: await this.jobs.seed() };
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(id, dto);
  }

  @Post(':id/move')
  @HttpCode(200)
  move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveJobDto) {
    return this.jobs.move(id, dto.col, dto.index);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.jobs.remove(id);
  }
}
