'use client';

import { useState } from 'react';
import { JobInput } from '@/lib/types';
import { kwHit, techOf } from '@/lib/tech';
import { useToast } from './ui';

const DEFAULT_KW = 'angular, typescript, rxjs, c#, .net, dotnet, asp.net, entity framework';

export default function PasteTab({ onAdd }: { onAdd: (input: JobInput) => Promise<boolean | null> }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [kw, setKw] = useState(DEFAULT_KW);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const words = kw.split(',').map((s) => s.trim()).filter(Boolean);
    const parts = text.split(/^\s*-{3,}\s*$/m).map((s) => s.trim()).filter((s) => s.length > 30);
    setBusy(true);
    let added = 0;
    let skipped = 0;
    for (const t of parts) {
      const known = techOf(t);
      const extra = words.filter((w) => kwHit(t, w) && !known.some((k) => k.toLowerCase() === w.toLowerCase()));
      const tech = [...new Set([...known, ...extra])];
      if (!tech.length) {
        skipped++;
        continue;
      }
      const first = t.split('\n').find((l) => l.trim().length > 8) ?? t;
      const link = t.match(/https?:\/\/(?:www\.|m\.)?facebook\.com\/\S+/)?.[0] ?? '';
      const ok = await onAdd({
        title: first.trim().slice(0, 200),
        tech,
        url: link.slice(0, 600),
        description: t.slice(0, 30000),
        source: 'Facebook (dán)',
        postedAt: new Date().toLocaleDateString('vi-VN'),
      });
      if (ok) added++;
      else skipped++;
    }
    setBusy(false);
    if (added) setText('');
    toast(`Đã thêm ${added} job vào bảng, bỏ qua ${skipped} (không khớp công nghệ hoặc trùng)`);
  }

  return (
    <section>
      <p className="hint">
        Copy nội dung bài trong group Facebook rồi dán vào. Nhiều bài thì ngăn cách bằng một dòng <b>---</b>.
        Bài không liên quan Angular / .NET sẽ bị bỏ qua; bài hợp lệ được thêm thẳng vào cột &quot;Mới&quot; của bảng việc.
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Dán bài tuyển dụng ở đây…" />
      <div className="tools" style={{ marginTop: 10 }}>
        <input type="text" value={kw} onChange={(e) => setKw(e.target.value)} style={{ flex: 1, minWidth: 240 }} title="Từ khoá công nghệ, cách nhau bằng dấu phẩy" />
        <button className="btn pri" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? 'Đang thêm…' : 'Lọc & thêm vào bảng'}
        </button>
      </div>
    </section>
  );
}
