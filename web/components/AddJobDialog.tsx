'use client';

import { FormEvent, useEffect, useState } from 'react';
import { techOf } from '@/lib/tech';
import { JobInput } from '@/lib/types';

interface Props {
  onClose: () => void;
  onAdd: (input: JobInput) => Promise<boolean | null>;
  onDuplicate: () => void;
}

/** Form thêm job thủ công (thay cho window.prompt, vốn không chạy trong browser pane của app) */
export default function AddJobDialog({ onClose, onAdd, onDuplicate }: Props) {
  const [f, setF] = useState({ title: '', company: '', location: '', salary: '', contact: '', url: '', description: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    setBusy(true);
    const ok = await onAdd({
      title: f.title.trim(),
      company: f.company.trim(),
      location: f.location.trim(),
      salary: f.salary.trim(),
      contact: f.contact.trim(),
      url: f.url.trim(),
      description: f.description.trim(),
      tech: techOf(`${f.title} ${f.description}`),
      source: 'Thủ công',
    });
    setBusy(false);
    if (ok === false) onDuplicate();
    else if (ok) onClose();
  }

  return (
    <div className="dlg-wrap" onClick={onClose}>
      <form className="dlg" style={{ width: 'min(520px,100%)' }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Thêm job thủ công</h3>
        <p>Job mới sẽ vào trang &quot;Mới&quot;. Công nghệ được nhận diện tự động từ tiêu đề và mô tả.</p>
        <label>Vị trí *</label>
        <input type="text" autoFocus required value={f.title} onChange={set('title')} placeholder="vd. Senior Angular Developer" maxLength={300} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label>Công ty</label><input type="text" value={f.company} onChange={set('company')} maxLength={200} /></div>
          <div><label>Địa điểm</label><input type="text" value={f.location} onChange={set('location')} maxLength={200} /></div>
          <div><label>Lương</label><input type="text" value={f.salary} onChange={set('salary')} placeholder="vd. 35-45M" maxLength={200} /></div>
          <div><label>Liên hệ</label><input type="text" value={f.contact} onChange={set('contact')} placeholder="email / zalo" maxLength={300} /></div>
        </div>
        <label>Link bài tuyển dụng</label>
        <input type="text" value={f.url} onChange={set('url')} placeholder="https://…" maxLength={600} />
        <label>Mô tả / ghi chú JD</label>
        <textarea style={{ minHeight: 90 }} value={f.description} onChange={set('description')} />
        <div className="btns">
          <button type="button" className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn pri" disabled={busy || !f.title.trim()}>{busy ? 'Đang thêm…' : 'Thêm job'}</button>
        </div>
      </form>
    </div>
  );
}
