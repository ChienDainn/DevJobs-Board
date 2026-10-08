'use client';

import { DragEvent, useMemo, useState } from 'react';
import { downloadCsv } from '@/lib/csv';
import { cityOf, CITIES } from '@/lib/tech';
import { COLS, Job } from '@/lib/types';
import { Avatar, copyText, Icon, Tags, useConfirm, useToast } from './ui';

const byPos = (a: Job, b: Job) => a.position - b.position;

interface Props {
  jobs: Job[];
  onOpen: (id: string) => void;
  onMove: (id: string, col: number, index: number) => void;
  onRemove: (id: string) => void;
}

export default function BoardTab({ jobs, onOpen, onMove, onRemove }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [fTech, setFTech] = useState<string | null>(null);
  const [fCity, setFCity] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);

  const techs = useMemo(() => [...new Set(jobs.flatMap((j) => j.tech))], [jobs]);

  const visible = (j: Job) => {
    const s = q.trim().toLowerCase();
    return (
      (!s || (j.title + ' ' + j.company + ' ' + j.location + ' ' + j.salary + ' ' + j.tech.join(' ') + ' ' + j.note).toLowerCase().includes(s)) &&
      (!fTech || j.tech.includes(fTech)) &&
      (!fCity || cityOf(j) === fCity)
    );
  };

  function onDrop(e: DragEvent, col: number) {
    e.preventDefault();
    if (!dragId) return;
    const overId = (e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id');
    // chỉ số trong cột đích (danh sách không gồm thẻ đang kéo)
    const list = jobs.filter((j) => j.col === col && j.id !== dragId).sort(byPos);
    const i = overId ? list.findIndex((j) => j.id === overId) : -1;
    onMove(dragId, col, i < 0 ? list.length : i);
    setDragId(null);
    setOverCol(null);
  }

  return (
    <section>
      <div className="tools">
        <label className="search">
          {Icon.search}
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong bảng việc: vị trí, công ty, lương, ghi chú…" />
        </label>
        <button
          className="btn"
          onClick={() =>
            downloadCsv(
              'bang-viec.csv',
              jobs.map((j) => ({ ...j, status: COLS[j.col]?.name, tech: j.tech.join('; ') })),
              ['status', 'title', 'company', 'location', 'salary', 'tech', 'contact', 'url', 'source', 'postedAt', 'note'],
            )
          }
        >
          Xuất CSV
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
      </div>

      <div className="board">
        {COLS.map((c, ci) => {
          if (ci === 0) return null; // cột "Mới" có trang riêng (NewJobs)
          const items = jobs.filter((j) => j.col === ci && visible(j)).sort(byPos);
          return (
            <div
              key={c.name}
              className={'col' + (overCol === ci && dragId ? ' over' : '')}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverCol(ci);
              }}
              onDrop={(e) => onDrop(e, ci)}
            >
              <div className="col-h">
                <span className="dot" style={{ background: c.color }} />
                {c.name}
                <span className="cnt">{items.length}</span>
              </div>
              <div className="col-b">
                {items.length === 0 && <div className="empty">Kéo job vào đây</div>}
                {items.map((j) => (
                  <div
                    key={j.id}
                    data-id={j.id}
                    className={'card' + (dragId === j.id ? ' drag' : '')}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', j.id);
                      setDragId(j.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => onOpen(j.id)}
                  >
                    <div className="row">
                      <Avatar name={j.company || j.title} />
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ttl">{j.title}</h3>
                        <div className="sub">
                          {j.company}
                          {j.location ? ' · ' + j.location : ''}
                        </div>
                      </div>
                    </div>
                    {j.salary && <span className="money">{j.salary}</span>}
                    <Tags tech={j.tech} />
                    {j.note && <div className="note">📝 {j.note}</div>}
                    <div className="foot" onClick={(e) => e.stopPropagation()}>
                      <span>{j.postedAt}</span>
                      <span className="sp" />
                      {j.url && (
                        <a className="ib" href={j.url} target="_blank" rel="noopener noreferrer" title="Mở bài gốc">{Icon.open}</a>
                      )}
                      {j.contact && (
                        <button
                          className="ib"
                          title={'Copy liên hệ: ' + j.contact}
                          onClick={async () => toast((await copyText(j.contact)) ? 'Đã copy: ' + j.contact : 'Không copy được')}
                        >
                          {Icon.copy}
                        </button>
                      )}
                      <button
                        className="ib del"
                        title="Xoá"
                        onClick={async () => (await confirm('Xoá job này khỏi bảng?')) && onRemove(j.id)}
                      >
                        {Icon.del}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
