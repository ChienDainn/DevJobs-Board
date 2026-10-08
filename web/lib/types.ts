export interface Job {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  tech: string[];
  url: string;
  contact: string;
  source: string;
  postedAt: string;
  note: string;
  description: string;
  col: number;
  position: number;
  createdAt: string;
}

/** Dữ liệu tạo job mới (khớp CreateJobDto của API) */
export interface JobInput {
  title: string;
  company?: string;
  location?: string;
  salary?: string;
  tech?: string[];
  url?: string;
  contact?: string;
  source?: string;
  postedAt?: string;
  note?: string;
  description?: string;
  col?: number;
}

export const COLS = [
  { name: 'Mới', color: '#64748b' },
  { name: 'Quan tâm', color: '#f59e0b' },
  { name: 'Đã ib / ứng tuyển', color: '#0ea5e9' },
  { name: 'Phỏng vấn', color: '#8b5cf6' },
  { name: 'Offer', color: '#10b981' },
  { name: 'Bỏ qua', color: '#94a3b8' },
] as const;

export type LocKind = 'regions' | 'city' | 'free';

/** Job online do API gộp từ nhiều nguồn (xem api/src/online) */
export interface OnlineJobRaw {
  title: string;
  company: string;
  location: string;
  locKind: LocKind;
  url: string;
  date: string;
  source: string;
  salary: string;
  text: string;
  vnOk?: boolean;
}

export interface SourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface OnlineJob extends OnlineJobRaw {
  tech: string[];
  regions: string[];
  vn: boolean;
}
