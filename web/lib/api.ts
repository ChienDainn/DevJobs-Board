import type { Job, JobInput, OnlineJobRaw, SourceStatus } from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = Array.isArray(j.message) ? j.message.join(', ') : j.message || j.error || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const body = (v: unknown) => JSON.stringify(v);

export const api = {
  login: (password: string) => req<{ ok: true }>('/auth/login', { method: 'POST', body: body({ password }) }),
  logout: () => req<{ ok: true }>('/auth/logout', { method: 'POST' }),
  listJobs: () => req<Job[]>('/jobs'),
  createJob: (dto: JobInput) => req<{ job: Job; created: boolean }>('/jobs', { method: 'POST', body: body(dto) }),
  updateJob: (id: string, patch: Partial<JobInput>) => req<Job>(`/jobs/${id}`, { method: 'PATCH', body: body(patch) }),
  moveJob: (id: string, col: number, index: number) =>
    req<Job>(`/jobs/${id}/move`, { method: 'POST', body: body({ col, index }) }),
  deleteJob: (id: string) => req<void>(`/jobs/${id}`, { method: 'DELETE' }),
  seed: () => req<{ imported: number }>('/jobs/seed', { method: 'POST' }),
  online: (refresh = false) =>
    req<{ jobs: OnlineJobRaw[]; sources: SourceStatus[]; fetchedAt: string }>('/online' + (refresh ? '?refresh=1' : '')),
};
