'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { fetchOnlineJobs } from '@/lib/online';
import { JobInput, OnlineJob, SourceStatus } from '@/lib/types';
import { Avatar, Icon, Tags, useToast } from './ui';

const VN = '__vn';

export default function OnlineJobs({ onAdd }: { onAdd: (input: JobInput) => Promise<boolean | null> }) {
  const toast = useToast();
  const [jobs, setJobs] = useState<OnlineJob[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [fetchedAt, setFetchedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetchOnlineJobs(refresh);
      setJobs(r.jobs);
      setSources(r.sources);
      setFetchedAt(r.fetchedAt);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được job online');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    jobs.forEach((j) => j.regions.forEach((r) => m.set(r, (m.get(r) ?? 0) + 1)));
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [jobs]);
  const vnCount = jobs.filter((j) => j.vn).length;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (!s || (j.title + ' ' + j.company + ' ' + j.location + ' ' + j.text).toLowerCase().includes(s)) &&
        (!country || (country === VN ? j.vn : j.regions.includes(country))) &&
        (!source || j.source === source),
    );
  }, [jobs, q, country, source]);

  async function addToBoard(j: OnlineJob) {
    const ok = await onAdd({
      title: j.title,
      company: j.company,
      location: j.regions.join(', ') || j.location,
      salary: j.salary,
      tech: j.tech,
      url: j.url,
      source: j.source,
      postedAt: j.date,
      description: j.text.slice(0, 8000),
    });
    toast(ok ? 'Đã thêm vào trang "Mới"' : ok === false ? 'Job đã có trong bảng' : 'Không thêm được');
  }

  const time = fetchedAt ? new Date(fetchedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <section>
      <div className="tools">
        <label className="search">
          {Icon.search}
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc thêm: remote, senior, vietnam…" />
        </label>
        <button className="btn" onClick={() => load(true)} disabled={loading}>↻ Tải lại</button>
        <button
          className="btn"
          onClick={() =>
            downloadCsv(
              'jobs-online.csv',
              rows.map((j) => ({ ...j, tech: j.tech.join('; '), countries: j.regions.join('; '), vn: j.vn ? 'có' : '' })),
              ['date', 'title', 'company', 'countries', 'vn', 'salary', 'tech', 'source', 'url'],
            )
          }
        >
          Xuất CSV
        </button>
      </div>

      <div className="chips">
        <span className="lbl">Quốc gia</span>
        <button className={'chip' + (!country ? ' on' : '')} onClick={() => setCountry(null)}>Tất cả ({jobs.length})</button>
        <button className={'chip' + (country === VN ? ' on' : '')} onClick={() => setCountry(VN)}>🌏 Làm được từ Việt Nam ({vnCount})</button>
        <span className="sep" />
        {counts.map(([r, n]) => (
          <button key={r} className={'chip' + (country === r ? ' on' : '')} onClick={() => setCountry(r)}>{r} ({n})</button>
        ))}
      </div>

      <div className="chips">
        <span className="lbl">Nguồn</span>
        <button className={'chip' + (!source ? ' on' : '')} onClick={() => setSource(null)}>Tất cả</button>
        {sources.map((s) => (
          <button
            key={s.name}
            className={'chip' + (source === s.name ? ' on' : '')}
            disabled={!s.ok}
            title={s.ok ? `${s.count} job Angular/.NET` : `Lỗi: ${s.error}`}
            onClick={() => setSource(s.name)}
          >
            {s.ok ? `${s.name} (${s.count})` : `⚠ ${s.name}`}
          </button>
        ))}
      </div>

      <p className="hint">
        {loading ? 'Đang tải job từ các nguồn…' : error ? error : `${rows.length} job`}
        {!loading && time ? ` · cập nhật ${time} (lưu tạm 20 phút)` : ''}
      </p>

      <div className="grid">
        {rows.map((j) => (
          <div key={j.url} className="card">
            <div className="row">
              <Avatar name={j.company || j.title} />
              <div style={{ minWidth: 0 }}>
                <h3 className="ttl">
                  <a href={j.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{j.title}</a>
                </h3>
                <div className="sub" title={j.location}>
                  {j.company} · {j.regions.slice(0, 3).join(', ')}
                  {j.regions.length > 3 ? ` +${j.regions.length - 3}` : ''}
                </div>
              </div>
            </div>
            {j.vn && <span className="vnb">🌏 Nhận ứng viên từ Việt Nam</span>}
            {j.salary && <span className="money">{j.salary}</span>}
            <Tags tech={j.tech} />
            <div className="foot">
              <span>{j.date} · {j.source}</span>
              <span className="sp" />
              <button className="btn" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => addToBoard(j)}>+ Vào bảng</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
