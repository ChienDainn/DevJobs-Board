import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { CreateJobDto, UpdateJobDto } from './jobs.dto';
import { Job } from './job.entity';

interface SeedJob {
  t: string; c?: string; l?: string; s?: string; k?: string[]; u?: string;
  ct?: string; g?: string; d?: string; n?: string; x?: string;
}

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly log = new Logger(JobsService.name);
  constructor(@InjectRepository(Job) private readonly repo: Repository<Job>) {}

  /** Lần chạy đầu (bảng trống): nạp sẵn các job đã kéo từ Facebook */
  async onModuleInit() {
    if ((await this.repo.count()) === 0) {
      const n = await this.seed();
      this.log.log(`Bảng trống: đã nạp ${n} job mẫu`);
    }
  }

  list() {
    return this.repo.find({ order: { col: 'ASC', position: 'ASC', createdAt: 'ASC' } });
  }

  private key(dto: { url?: string; title: string; company?: string }) {
    return (dto.url || `${dto.title}|${dto.company ?? ''}`).slice(0, 600);
  }

  /** Tạo job; nếu đã có (cùng link / tiêu đề+công ty) thì trả về job cũ với created=false */
  async create(dto: CreateJobDto): Promise<{ job: Job; created: boolean }> {
    const externalId = this.key(dto);
    const existing = await this.repo.findOne({ where: { externalId } });
    if (existing) return { job: existing, created: false };
    const col = dto.col ?? 0;
    const max = await this.repo.maximum('position', { col });
    const job = this.repo.create({
      externalId,
      title: dto.title,
      company: dto.company ?? '',
      location: dto.location ?? '',
      salary: dto.salary ?? '',
      tech: dto.tech ?? [],
      url: dto.url ?? '',
      contact: dto.contact ?? '',
      source: dto.source ?? '',
      postedAt: dto.postedAt ?? '',
      note: dto.note ?? '',
      description: dto.description ?? '',
      col,
      position: (max ?? -1) + 1,
    });
    return { job: await this.repo.save(job), created: true };
  }

  async update(id: string, dto: UpdateJobDto) {
    const job = await this.get(id);
    Object.assign(job, dto);
    return this.repo.save(job);
  }

  async move(id: string, col: number, index: number) {
    return this.repo.manager.transaction(async (m) => {
      const job = await m.findOne(Job, { where: { id } });
      if (!job) throw new NotFoundException();
      const target = await m.find(Job, { where: { col }, order: { position: 'ASC', createdAt: 'ASC' } });
      const list = target.filter((j) => j.id !== id);
      list.splice(Math.min(index, list.length), 0, job);
      job.col = col;
      list.forEach((j, n) => (j.position = n));
      await m.save(list);
      return job;
    });
  }

  async remove(id: string) {
    const r = await this.repo.delete(id);
    if (!r.affected) throw new NotFoundException();
  }

  /** Nhập (idempotent) các job Facebook từ seed/fb-jobs.json; bỏ qua job đã có */
  async seed(): Promise<number> {
    // fb-jobs.private.json (đầy đủ liên hệ, không commit) được ưu tiên hơn fb-jobs.json (đã bỏ liên hệ)
    const dir = join(process.cwd(), 'seed');
    const priv = join(dir, 'fb-jobs.private.json');
    const file = process.env.SEED_FILE || (existsSync(priv) ? priv : join(dir, 'fb-jobs.json'));
    if (!existsSync(file)) return 0;
    const items: SeedJob[] = JSON.parse(readFileSync(file, 'utf8'));
    let n = 0;
    for (const s of items) {
      const r = await this.create({
        title: s.t, company: s.c, location: s.l, salary: s.s, tech: s.k, url: s.u,
        contact: s.ct, source: s.g, postedAt: s.d, note: s.n, description: s.x,
      });
      if (r.created) n++;
    }
    return n;
  }

  private async get(id: string) {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException();
    return job;
  }
}
