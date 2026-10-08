'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Job, JobInput } from '@/lib/types';

export type Status = 'loading' | 'login' | 'ready' | 'error';
export type Sync = 'idle' | 'saving' | 'error';

const byPos = (a: Job, b: Job) => a.position - b.position;

/** Áp dụng thao tác kéo thả cục bộ (optimistic) giống logic của API */
export function applyMove(jobs: Job[], id: string, col: number, index: number): Job[] {
  const job = jobs.find((j) => j.id === id);
  if (!job) return jobs;
  const target = jobs.filter((j) => j.col === col && j.id !== id).sort(byPos);
  target.splice(Math.min(index, target.length), 0, { ...job, col });
  return [...jobs.filter((j) => j.col !== col && j.id !== id), ...target.map((j, i) => ({ ...j, position: i }))];
}

export function useJobs(onError: (msg: string) => void) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [sync, setSync] = useState<Sync>('idle');
  const pending = useRef(0);

  const refresh = useCallback(async () => {
    try {
      setJobs(await api.listJobs());
      setStatus('ready');
    } catch (e) {
      setStatus(e instanceof ApiError && e.status === 401 ? 'login' : 'error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Chạy thao tác ghi: cập nhật UI trước (optimistic), lỗi thì tải lại từ server */
  const mutate = useCallback(
    async (optimistic: ((j: Job[]) => Job[]) | null, call: () => Promise<unknown>) => {
      if (optimistic) setJobs(optimistic);
      pending.current++;
      setSync('saving');
      try {
        await call();
        pending.current--;
        if (!pending.current) setSync('idle');
        return true;
      } catch (e) {
        pending.current--;
        setSync('error');
        if (e instanceof ApiError && e.status === 401) setStatus('login');
        else onError('Không lưu được: ' + (e instanceof Error ? e.message : 'lỗi'));
        await refresh();
        if (!pending.current) setSync('idle');
        return false;
      }
    },
    [onError, refresh],
  );

  const add = useCallback(
    async (input: JobInput): Promise<boolean | null> => {
      try {
        const r = await api.createJob(input);
        if (r.created) setJobs((js) => [...js, r.job]);
        return r.created;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setStatus('login');
        else onError('Không thêm được job: ' + (e instanceof Error ? e.message : 'lỗi'));
        return null;
      }
    },
    [onError],
  );

  const patch = useCallback(
    (id: string, p: Partial<JobInput>) =>
      mutate((js) => js.map((j) => (j.id === id ? ({ ...j, ...p } as Job) : j)), () => api.updateJob(id, p)),
    [mutate],
  );

  const move = useCallback(
    (id: string, col: number, index: number) =>
      mutate((js) => applyMove(js, id, col, index), () => api.moveJob(id, col, index)),
    [mutate],
  );

  const remove = useCallback(
    (id: string) => mutate((js) => js.filter((j) => j.id !== id), () => api.deleteJob(id)),
    [mutate],
  );

  const reseed = useCallback(async () => {
    try {
      const r = await api.seed();
      await refresh();
      return r.imported;
    } catch {
      onError('Không nạp lại được job mẫu');
      return 0;
    }
  }, [onError, refresh]);

  return { jobs, status, sync, refresh, add, patch, move, remove, reseed, setStatus };
}
