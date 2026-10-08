import { Injectable, Logger } from '@nestjs/common';

export type LocKind = 'regions' | 'city' | 'free';

export interface OnlineJobDto {
  title: string;
  company: string;
  location: string;
  /** cách hiểu chuỗi địa điểm: danh sách vùng / tên thành phố / văn bản tự do */
  locKind: LocKind;
  url: string;
  date: string; // YYYY-MM-DD
  source: string;
  salary: string;
  text: string;
  /** Nguồn tự khẳng định có/không nhận ứng viên từ Việt Nam (nếu biết) */
  vnOk?: boolean;
}

export interface SourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface OnlineResult {
  jobs: OnlineJobDto[];
  sources: SourceStatus[];
  fetchedAt: string;
}

/** Chỉ giữ job nhắc tới stack quan tâm (TypeScript đứng một mình không đủ, tránh nhiễu từ job React/Node) */
const CORE = /angular|rxjs|(^|[^\w])c#|(^|[^\w])(\.net|dotnet|asp\.net)(?![\w])|entity framework/i;

const CACHE_MS = 20 * 60 * 1000;
const MIN_REFRESH_MS = 60 * 1000;
const TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (compatible; DevJobsBoard/1.0; personal job tracker)';

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');

/** HTML (có thể bị escape trong RSS) -> văn bản thuần */
function toText(raw: string): string {
  let h = raw || '';
  if (h.includes('&lt;')) h = decode(h);
  h = h
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decode(h).replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim();
}

const isoDate = (v: string | number | undefined) => {
  const d = new Date(v ?? '');
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

async function fetchRaw(url: string): Promise<string> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA, Accept: '*/*' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
const fetchJson = async <T>(url: string) => JSON.parse(await fetchRaw(url)) as T;

/* ---------- RSS tối giản (đủ cho WWR / Jobspresso) ---------- */
function rssItems(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}
function tag(item: string, name: string): string {
  const m = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  const v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : v;
}

/* ---------- các nguồn ---------- */
type Fetcher = () => Promise<OnlineJobDto[]>;

const remotive: Fetcher = async () => {
  type R = { jobs: { title: string; company_name: string; candidate_required_location: string; url: string;
    publication_date: string; salary?: string; description: string }[] };
  const out: OnlineJobDto[] = [];
  const results = await Promise.allSettled(
    ['angular', 'dotnet', 'c#', '.net'].map((k) => fetchJson<R>('https://remotive.com/api/remote-jobs?search=' + encodeURIComponent(k))),
  );
  if (results.every((r) => r.status === 'rejected')) throw new Error('không tải được');
  for (const r of results)
    if (r.status === 'fulfilled')
      for (const j of r.value.jobs)
        out.push({
          title: j.title, company: j.company_name, location: j.candidate_required_location, locKind: 'regions',
          url: j.url, date: isoDate(j.publication_date), source: 'Remotive', salary: j.salary || '', text: toText(j.description),
        });
  return out;
};

const arbeitnow: Fetcher = async () => {
  type R = { data: { title: string; company_name: string; location: string; remote: boolean; url: string;
    created_at: number; description: string; tags?: string[] }[] };
  const out: OnlineJobDto[] = [];
  const pages = await Promise.allSettled([1, 2, 3].map((p) => fetchJson<R>('https://www.arbeitnow.com/api/job-board-api?page=' + p)));
  if (pages.every((r) => r.status === 'rejected')) throw new Error('không tải được');
  for (const r of pages)
    if (r.status === 'fulfilled')
      for (const j of r.value.data)
        out.push({
          title: j.title, company: j.company_name, location: j.location + (j.remote ? ' (remote)' : ''), locKind: 'city',
          url: j.url, date: isoDate(j.created_at * 1000), source: 'Arbeitnow', salary: '',
          text: toText(j.description) + '\n' + (j.tags ?? []).join(' '),
        });
  return out;
};

const remoteok: Fetcher = async () => {
  type J = { position?: string; company?: string; location?: string; url?: string; date?: string; tags?: string[];
    description?: string; salary_min?: number; salary_max?: number };
  const arr = await fetchJson<J[]>('https://remoteok.com/api');
  return arr
    .filter((j) => j.position && j.url)
    .map((j) => {
      const sal = j.salary_min && j.salary_max ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k / năm` : '';
      return {
        title: j.position as string, company: j.company || '', location: j.location || 'Worldwide', locKind: 'free' as const,
        url: j.url as string, date: isoDate(j.date), source: 'RemoteOK', salary: sal,
        text: toText(j.description || '') + '\n' + (j.tags ?? []).join(' '),
      };
    });
};

const wwr: Fetcher = async () => {
  const cats = ['remote-programming-jobs', 'remote-full-stack-programming-jobs', 'remote-back-end-programming-jobs', 'remote-front-end-programming-jobs'];
  const feeds = await Promise.allSettled(cats.map((c) => fetchRaw(`https://weworkremotely.com/categories/${c}.rss`)));
  if (feeds.every((r) => r.status === 'rejected')) throw new Error('không tải được');
  const out: OnlineJobDto[] = [];
  for (const f of feeds) {
    if (f.status !== 'fulfilled') continue;
    for (const it of rssItems(f.value)) {
      const full = decode(tag(it, 'title'));
      const i = full.indexOf(': ');
      const company = i > 0 ? full.slice(0, i) : '';
      const title = i > 0 ? full.slice(i + 2) : full;
      const region = decode(tag(it, 'region'));
      const countries = decode(tag(it, 'country'))
        .split(/,\s*|\s+and\s+/)
        .map((c) => c.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s+of Great Britain and Northern Ireland/i, '').trim())
        .filter(Boolean);
      out.push({
        title, company,
        location: countries.length ? countries.join(', ') : region || 'Worldwide',
        locKind: 'regions',
        url: tag(it, 'link') || tag(it, 'guid'),
        date: isoDate(tag(it, 'pubDate')),
        source: 'We Work Remotely',
        salary: '',
        text: toText(tag(it, 'description')) + '\n' + decode(tag(it, 'skills')),
        vnOk: countries.length ? countries.some((c) => /viet\s?nam/i.test(c)) : undefined,
      });
    }
  }
  return out;
};

const jobspresso: Fetcher = async () => {
  const xml = await fetchRaw('https://jobspresso.co/remote-work/?feed=job_feed');
  return rssItems(xml).map((it) => {
    const creator = tag(it, 'dc:creator').split(/<br\s*\/?>/i);
    const location = decode(creator.slice(1).join(' ')).replace(/⚲/g, '').trim() || 'Worldwide';
    return {
      title: decode(tag(it, 'title')), company: decode(creator[0] || '').trim(), location, locKind: 'regions' as const,
      url: tag(it, 'link'), date: isoDate(tag(it, 'pubDate')), source: 'Jobspresso', salary: '',
      text: toText(tag(it, 'content:encoded') || tag(it, 'description')),
    };
  });
};

const SOURCES: { name: string; fetch: Fetcher }[] = [
  { name: 'Remotive', fetch: remotive },
  { name: 'Arbeitnow', fetch: arbeitnow },
  { name: 'RemoteOK', fetch: remoteok },
  { name: 'We Work Remotely', fetch: wwr },
  { name: 'Jobspresso', fetch: jobspresso },
];

@Injectable()
export class OnlineService {
  private readonly log = new Logger(OnlineService.name);
  private cache?: { at: number; data: OnlineResult };
  private inflight?: Promise<OnlineResult>;

  /** Trả cache nếu còn mới (20 phút); refresh=true bỏ qua cache nhưng tối đa 1 lần / phút */
  async get(refresh = false): Promise<OnlineResult> {
    const age = this.cache ? Date.now() - this.cache.at : Infinity;
    if (this.cache && (age < MIN_REFRESH_MS || (!refresh && age < CACHE_MS))) return this.cache.data;
    if (!this.inflight) {
      this.inflight = this.load().finally(() => (this.inflight = undefined));
    }
    return this.inflight;
  }

  private async load(): Promise<OnlineResult> {
    const settled = await Promise.allSettled(SOURCES.map((s) => s.fetch()));
    const all = new Map<string, OnlineJobDto>();
    const sources: SourceStatus[] = [];
    settled.forEach((r, i) => {
      const name = SOURCES[i].name;
      if (r.status === 'rejected') {
        this.log.warn(`${name}: ${r.reason?.message ?? r.reason}`);
        sources.push({ name, ok: false, count: 0, error: String(r.reason?.message ?? 'lỗi') });
        return;
      }
      let n = 0;
      for (const j of r.value) {
        if (!j.url || !j.title || !CORE.test(`${j.title} ${j.text}`) || all.has(j.url)) continue;
        all.set(j.url, { ...j, text: j.text.slice(0, 6000) });
        n++;
      }
      sources.push({ name, ok: true, count: n });
    });
    const jobs = [...all.values()].sort((a, b) => b.date.localeCompare(a.date));
    const data: OnlineResult = { jobs, sources, fetchedAt: new Date().toISOString() };
    // chỉ cache khi có ít nhất một nguồn thành công
    if (sources.some((s) => s.ok)) this.cache = { at: Date.now(), data };
    return data;
  }
}
