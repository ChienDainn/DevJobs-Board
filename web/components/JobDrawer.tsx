'use client';

import { useEffect, useRef, useState } from 'react';
import { COLS, Job, JobInput } from '@/lib/types';
import { Avatar, copyText, Tags, useConfirm, useToast } from './ui';

interface Props {
  job: Job;
  onClose: () => void;
  onPatch: (id: string, p: Partial<JobInput>) => void;
  onMove: (id: string, col: number, index: number) => void;
  onDelete: (id: string) => void;
}

function Row({ k, children }: { k: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <>
      <dt>{k}</dt>
      <dd>{children}</dd>
    </>
  );
}

export default function JobDrawer({ job, onClose, onPatch, onMove, onDelete }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [shown, setShown] = useState(false);
  const [note, setNote] = useState(job.note);

  // hiệu ứng trượt vào
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Esc để đóng
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // tự lưu ghi chú sau 600ms; lưu nốt khi đóng khung
  useEffect(() => {
    if (note === job.note) return;
    const t = setTimeout(() => onPatch(job.id, { note }), 600);
    return () => clearTimeout(t);
  }, [note, job.note, job.id, onPatch]);
  const latest = useRef({ note, job, onPatch });
  latest.current = { note, job, onPatch };
  useEffect(
    () => () => {
      const { note: n, job: j, onPatch: p } = latest.current;
      if (n !== j.note) p(j.id, { note: n });
    },
    [],
  );

  return (
    <>
      <div className={'ov' + (shown ? ' show' : '')} onClick={onClose} />
      <aside className={'dr' + (shown ? ' show' : '')} role="dialog" aria-modal="true" aria-label="Chi tiết job">
        <div className="dr-h">
          <Avatar name={job.company || job.title} />
          <div style={{ minWidth: 0 }}>
            <h2>{job.title}</h2>
            <div className="sub">
              {job.company}
              {job.location ? ' · ' + job.location : ''}
            </div>
          </div>
          <button className="dr-x" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="dr-b">
          {job.salary && <span className="money" style={{ margin: '0 0 8px' }}>{job.salary}</span>}
          <Tags tech={job.tech} />

          <div className="sec">Tiến độ</div>
          <select value={job.col} onChange={(e) => onMove(job.id, +e.target.value, 9999)}>
            {COLS.map((c, i) => (
              <option key={c.name} value={i}>{c.name}</option>
            ))}
          </select>

          <div className="sec">Thông tin</div>
          <dl className="kv">
            <Row k="Địa điểm">{job.location}</Row>
            <Row k="Lương">{job.salary}</Row>
            <Row k="Liên hệ">
              {job.contact && (
                <>
                  {job.contact}{' '}
                  <a
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      toast((await copyText(job.contact)) ? 'Đã copy liên hệ' : 'Không copy được');
                    }}
                  >
                    copy
                  </a>
                </>
              )}
            </Row>
            <Row k="Nguồn">{job.source}</Row>
            <Row k="Đăng">{job.postedAt}</Row>
          </dl>

          <div className="sec">Mô tả công việc</div>
          {job.description ? (
            <div className="jd">{job.description}</div>
          ) : (
            <p className="hint">
              Bài này chỉ có tiêu đề ngắn (người đăng yêu cầu inbox nhận JD).
              {job.url ? ' Mở bài gốc để xem bình luận / liên hệ.' : ''}
            </p>
          )}

          <div className="sec">Ghi chú của bạn</div>
          <textarea
            style={{ minHeight: 90 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Đã ib lúc nào, yêu cầu gì, lịch phỏng vấn…"
          />
        </div>

        <div className="dr-f">
          {job.url && (
            <a className="btn pri" style={{ color: '#fff' }} href={job.url} target="_blank" rel="noopener noreferrer">
              Mở bài gốc ↗
            </a>
          )}
          <button
            className="btn dng"
            onClick={async () => {
              if (await confirm('Xoá job này khỏi bảng?')) {
                onDelete(job.id);
                onClose();
              }
            }}
          >
            Xoá
          </button>
        </div>
      </aside>
    </>
  );
}
