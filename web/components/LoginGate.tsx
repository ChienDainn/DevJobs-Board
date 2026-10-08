'use client';

import { FormEvent, useState } from 'react';
import { api, ApiError } from '@/lib/api';

export default function LoginGate({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api.login(pw);
      onDone();
    } catch (err) {
      setMsg(err instanceof ApiError ? (err.status === 429 ? 'Thử quá nhiều lần, đợi 15 phút.' : err.message) : 'Không kết nối được server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login show">
      <form onSubmit={submit}>
        <div className="logo" style={{ margin: '0 auto 12px' }}>DJ</div>
        <h2 style={{ margin: '0 0 4px', textAlign: 'center' }}>DevJobs Board</h2>
        <p className="hint" style={{ textAlign: 'center' }}>Nhập mật khẩu để tiếp tục</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Mật khẩu"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', font: 'inherit' }}
        />
        <p style={{ color: '#d33', minHeight: 20, margin: '6px 0' }}>{msg}</p>
        <button className="btn pri" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
