'use client';

import { useEffect, useMemo, useState } from 'react';
import { googleUrl, GROUPS, KEYWORDS, Site, SiteGroup, SITES } from '@/lib/sites';
import { Avatar } from './ui';

const KEY = 'sites_visited_v1';
const today = () => new Date().toISOString().slice(0, 10);

/** Danh mục site tuyển dụng: mở nhanh trang tìm kiếm theo từ khoá, đánh dấu những site đã xem hôm nay */
export default function SitesTab({ onGoOnline }: { onGoOnline: () => void }) {
  const [kw, setKw] = useState(KEYWORDS[0]);
  const [group, setGroup] = useState<SiteGroup | null>(null);
  const [seen, setSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch {}
  }, []);

  const mark = (name: string) =>
    setSeen((s) => {
      const n = { ...s, [name]: today() };
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {}
      return n;
    });
  const resetSeen = () => {
    setSeen({});
    try {
      localStorage.removeItem(KEY);
    } catch {}
  };

  const rows = useMemo(() => SITES.filter((s) => !group || s.group === group), [group]);
  const seenToday = SITES.filter((s) => seen[s.name] === today()).length;

  function Card({ s }: { s: Site }) {
    const direct = s.direct?.(kw);
    const done = seen[s.name] === today();
    return (
      <div className="card" style={{ cursor: 'default', opacity: s.warn ? 0.85 : 1 }}>
        <div className="row">
          <Avatar name={s.name} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="ttl" style={{ cursor: 'default' }}>
              {s.name} {done && <span style={{ color: 'var(--money)' }} title="Đã xem hôm nay">✓</span>}
            </h3>
            <div className="sub">{s.desc}</div>
          </div>
        </div>
        {(s.feed || s.note) && (
          <div className="tags">
            {s.feed && (
              <span className="tag" style={{ ['--tc' as string]: '#0f9d6b' }}>✅ Đã tích hợp trong Job online</span>
            )}
            {s.note && <span className="tag" style={{ ['--tc' as string]: s.warn ? '#d97706' : '#6b7183' }}>{s.note}</span>}
          </div>
        )}
        <div className="foot">
          <a
            className="btn pri sm"
            style={{ color: '#fff', textDecoration: 'none' }}
            href={direct ?? googleUrl(s, kw)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => mark(s.name)}
            title={direct ? 'Mở trang tìm kiếm trên site' : 'Site chưa có link tìm kiếm trực tiếp — tìm qua Google'}
          >
            {direct ? `Tìm "${kw}" ↗` : 'Tìm qua Google ↗'}
          </a>
          {direct && (
            <a className="btn sm" style={{ textDecoration: 'none', color: 'var(--text)' }} href={googleUrl(s, kw)} target="_blank" rel="noopener noreferrer" onClick={() => mark(s.name)}>
              Google
            </a>
          )}
          <span className="sp" />
          {s.feed && (
            <a href="#" onClick={(e) => { e.preventDefault(); onGoOnline(); }}>Xem trong Job online</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="feed-h">
        <h2>Tìm trên các site</h2>
        <span className="hint" style={{ margin: 0 }}>
          {SITES.length} site · hôm nay đã xem {seenToday}/{SITES.length}.{' '}
          {seenToday > 0 && <a href="#" onClick={(e) => { e.preventDefault(); resetSeen(); }}>Đặt lại</a>}
        </span>
      </div>
      <p className="hint">
        Hầu hết các site này không cho lấy dữ liệu tự động (không có API công khai, điều khoản cấm scraping), nên đây là lối tắt:
        bấm để mở trang tìm kiếm với từ khoá bạn chọn. Site có nhãn <b>✅</b> đã được gộp sẵn vào tab &quot;Job online&quot;.
      </p>

      <div className="chips">
        <span className="lbl">Từ khoá</span>
        {KEYWORDS.map((k) => (
          <button key={k} className={'chip' + (kw === k ? ' on' : '')} onClick={() => setKw(k)}>{k}</button>
        ))}
        <span className="sep" />
        <span className="lbl">Nhóm</span>
        <button className={'chip' + (!group ? ' on' : '')} onClick={() => setGroup(null)}>Tất cả</button>
        {(Object.keys(GROUPS) as SiteGroup[]).map((g) => (
          <button key={g} className={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>{GROUPS[g]}</button>
        ))}
      </div>

      {(Object.keys(GROUPS) as SiteGroup[])
        .filter((g) => !group || g === group)
        .map((g) => (
          <div key={g} style={{ marginBottom: 22 }}>
            <h3 style={{ margin: '4px 0 10px', fontSize: 15 }}>{GROUPS[g]}</h3>
            <div className="grid">
              {rows.filter((s) => s.group === g).map((s) => <Card key={s.name} s={s} />)}
            </div>
          </div>
        ))}
    </section>
  );
}
