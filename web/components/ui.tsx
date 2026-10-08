'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { techColor } from '@/lib/tech';

export function Avatar({ name }: { name: string }) {
  const s = (name || '?').trim();
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <div className="av" style={{ background: `hsl(${h} 55% 48%)` }}>
      {(s[0] || '?').toUpperCase()}
    </div>
  );
}

export function Tags({ tech }: { tech: string[] }) {
  if (!tech.length) return null;
  return (
    <div className="tags">
      {tech.map((t) => (
        <span key={t} className="tag" style={{ ['--tc' as string]: techColor(t) }}>
          {t}
        </span>
      ))}
    </div>
  );
}

const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
export const Icon = {
  open: (
    <svg {...svg}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  ),
  copy: (
    <svg {...svg}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  ),
  del: (
    <svg {...svg}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" {...svg}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
};

/* ---------- toast ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '')} role="status">
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- confirm trong trang (browser pane của app không hỗ trợ window.confirm) ---------- */
type ConfirmFn = (message: string, okLabel?: string) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; okLabel: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = useCallback<ConfirmFn>(
    (message, okLabel = 'Xoá') => new Promise((resolve) => setState({ message, okLabel, resolve })),
    [],
  );
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="dlg-wrap" onClick={() => close(false)}>
          <div className="dlg" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p style={{ color: 'var(--text)', margin: 0, fontSize: 15 }}>{state.message}</p>
            <div className="btns">
              <button className="btn" onClick={() => close(false)}>Huỷ</button>
              <button className="btn danger" autoFocus onClick={() => close(true)}>{state.okLabel}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
