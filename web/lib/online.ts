import { api } from './api';
import { classify, techOf } from './tech';
import type { OnlineJob, SourceStatus } from './types';

/** Lấy job online đã được API gộp từ nhiều nguồn, rồi gắn nhãn công nghệ + quốc gia */
export async function fetchOnlineJobs(refresh = false): Promise<{ jobs: OnlineJob[]; sources: SourceStatus[]; fetchedAt: string }> {
  const r = await api.online(refresh);
  const jobs: OnlineJob[] = r.jobs
    .map((j) => ({ ...j, tech: techOf(j.title + ' ' + j.text), ...classify(j.locKind, j.location, j.vnOk) }))
    .filter((j) => j.tech.length);
  return { jobs, sources: r.sources, fetchedAt: r.fetchedAt };
}
