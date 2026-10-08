import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OnlineService } from './online.service';

@UseGuards(AuthGuard)
@Controller('online')
export class OnlineController {
  constructor(private readonly online: OnlineService) {}

  /** Job Angular / .NET gộp từ nhiều nguồn công khai; cache 20 phút. ?refresh=1 để tải lại */
  @Get()
  list(@Query('refresh') refresh?: string) {
    return this.online.get(refresh === '1');
  }
}
