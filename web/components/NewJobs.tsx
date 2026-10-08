'use client';

import { useMemo, useState } from 'react';
import { cityOf, CITIES } from '@/lib/tech';
import { Job, JobInput } from '@/lib/types';
import AddJobDialog from './AddJobDialog';
import { Avatar, copyText, Icon, Tags, useToast } from './ui';

const COL_NEW = 0;
const COL_INTEREST = 1;
const COL_SKIP = 5;

interface Props {
  jobs: Job[];
  onOpen: (id: string) => void;
  onMove: (id: string, col: number, index: number) => void;
  onAdd: (input: JobInput) => Promise<boolean | null>;
  onReseed: () => Promise<number>;
}

/** Trang "Mới": hộp thư đến các job chưa xử lý, hiển thị lớn để đọc và phân loại nhanh */
export default function NewJobs({ jobs, onOpen, onMove, onAdd, onReseed }: Props) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [fTech, setFTech] = useState<string | null>(null);
  const [fCity, setFCity] = useState<string | null>(null);
  const [fSource, setFSource] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fresh = useMemo(() => jobs.filter((j) => j.col === COL_NEW).sort((a, b) => a.position - b.position), [jobs]);
  const techs = useMemo(() => [...new Set(fresh.flatMap((j) => j.tech))], [fresh]);
  const sources = useMemo(() => [...new Set(fresh.map((j) => j.source).filter(Boolean))], [fresh]);

  const rows = fresh.filter((j) => {
    const s = q.trim().toLowerCase();
    return (
      (!s || (j.title + ' ' + j.company + ' ' + j.location + ' ' + j.salary + ' ' + j.description).toLowerCase().includes(s)) &&
      (!fTech || j.tech.includes(fTech)) &&
      (!fCity || cityOf(j) === fCity) &&
      (!fSource || j.source === fSource)
    );
  });

  function decide(j: Job, col: number, msg: string) {
    onMove(j.id, col, col === COL_INTEREST ? 0 : 9999);
    toast(msg);
  }

  return (
    <section>
      <div className="feed-h">
        <h2>Job mới</h2>
        <span className="hint" style={{ margin: 0 }}>
          {fresh.length
            ? `${rows.length}/${fresh.length} job chưa xử lý — bấm "Quan tâm" để đưa vào bảng việc, "Bỏ qua" để ẩn.`
            : ''}
        </span>
      </div>

      <div className="tools">
        <label className="search">
          {Icon.search}
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong job mới: vị trí, công ty, lương, mô tả…" />
        </label>
        <button className="btn" onClick={() => setAdding(true)}>+ Thêm thủ công</button>
        <button
          className="btn"
          title="Nạp lại các job đã kéo từ Facebook (bỏ qua job đã có)"
          onClick={async () => {
            const n = await onReseed();
            toast(n ? `Đã nạp ${n} job mới` : 'Không có job mới để nạp');
          }}
        >
          ↻ Nạp job Facebook
        </button>
      </div>

      <div className="chips">
        <span className="lbl">Công nghệ</span>
        <button className={'chip' + (!fTech ? ' on' : '')} onClick={() => setFTech(null)}>Tất cả</button>
        {techs.map((t) => (
          <button key={t} className={'chip' + (fTech === t ? ' on' : '')} onClick={() => setFTech(t)}>{t}</button>
        ))}
        <span className="sep" />
        <span className="lbl">Nơi làm</span>
        <button className={'chip' + (!fCity ? ' on' : '')} onClick={() => setFCity(null)}>Tất cả</button>
        {CITIES.map(([c]) => (
          <button key={c} className={'chip' + (fCity === c ? ' on' : '')} onClick={() => setFCity(c)}>{c}</button>
        ))}
        {sources.length > 1 && (
          <>
            <span className="sep" />
            <span className="lbl">Nguồn</span>
            <button className={'chip' + (!fSource ? ' on' : '')} onClick={() => setFSource(null)}>Tất cả</button>
            {sources.map((s) => (
              <button key={s} className={'chip' + (fSource === s ? ' on' : '')} onClick={() => setFSource(s)}>{s}</button>
            ))}
          </>
        )}
      </div>

      {fresh.length === 0 && (
        <div className="donebox">
          <div style={{ fontSize: 34 }}>🎉</div>
          Đã xử lý hết job mới.<br />
          Thêm job từ tab &quot;Job online&quot; hoặc &quot;Dán bài Facebook&quot;.
        </div>
      )}
      {fresh.length > 0 && rows.length === 0 && <div className="donebox">Không có job nào khớp bộ lọc.</div>}

      {adding && <AddJobDialog onClose={() => setAdding(false)} onAdd={onAdd} onDuplicate={() => toast('Job này đã có')} />}

      <div className="feed">
        {rows.map((j) => (
          <article key={j.id} className="bigcard">
            <div className="row">
              <Avatar name={j.company || j.title} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 className="ttl" onClick={() => onOpen(j.id)}>{j.title}</h3>
                <div className="sub">
                  {j.company}
                  {j.location ? (j.company ? ' · ' : '') + j.location : ''}
                </div>
              </div>
            </div>

            <div className="meta">
              {j.salary && <span className="money">{j.salary}</span>}
              <Tags tech={j.tech} />
            </div>

            {j.description ? (
              <div className="excerpt">{j.description}</div>
            ) : (
              <div className="excerpt none">
                Bài này chỉ có tiêu đề ngắn — người đăng yêu cầu inbox nhận JD.
              </div>
            )}

            <div className="contact">
              {j.contact && <>✉ {j.contact} · </>}
              {j.source}
              {j.postedAt ? ' · ' + j.postedAt : ''}
            </div>

            <div className="acts">
              <button className="btn ok sm" onClick={() => decide(j, COL_INTEREST, 'Đã chuyển sang "Quan tâm"')}>★ Quan tâm</button>
              <button className="btn ghost sm" onClick={() => decide(j, COL_SKIP, 'Đã chuyển sang "Bỏ qua"')}>✕ Bỏ qua</button>
              <button className="btn sm" onClick={() => onOpen(j.id)}>Chi tiết</button>
              <span className="sp" />
              {j.contact && (
                <button
                  className="ib"
                  title={'Copy liên hệ: ' + j.contact}
                  onClick={async () => toast((await copyText(j.contact)) ? 'Đã copy: ' + j.contact : 'Không copy được')}
                >
                  {Icon.copy}
                </button>
              )}
              {j.url && (
                <a className="ib" href={j.url} target="_blank" rel="noopener noreferrer" title="Mở bài gốc">{Icon.open}</a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
