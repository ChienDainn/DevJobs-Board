'use client';

import { useCallback, useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { api } from '@/lib/api';
import BoardTab from './BoardTab';
import NewJobs from './NewJobs';
import JobDrawer from './JobDrawer';
import LoginGate from './LoginGate';
import OnlineJobs from './OnlineJobs';
import PasteTab from './PasteTab';
import SitesTab from './SitesTab';
import { ConfirmProvider, ToastProvider, useToast } from './ui';

type Tab = 'new' | 'board' | 'online' | 'sites' | 'paste';
const TABS: [Tab, string][] = [
  ['new', 'Mới'],
  ['board', 'Bảng việc'],
  ['online', 'Job online'],
  ['sites', 'Tìm trên các site'],
  ['paste', 'Dán bài Facebook'],
];

function Inner() {
  const toast = useToast();
  const onError = useCallback((m: string) => toast(m), [toast]);
  const { jobs, status, sync, refresh, add, patch, move, remove, reseed, setStatus } = useJobs(onError);
  const [tab, setTab] = useState<Tab>('new');
  const [openId, setOpenId] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setOpenId(null), []);

  if (status === 'login') return <LoginGate onDone={refresh} />;
  if (status === 'loading') return <div className="app"><p className="hint">Đang tải…</p></div>;
  if (status === 'error')
    return (
      <div className="app">
        <p className="hint">Không kết nối được API. Kiểm tra server rồi thử lại.</p>
        <button className="btn" onClick={refresh}>Thử lại</button>
      </div>
    );

  const count = (c: number) => jobs.filter((j) => j.col === c).length;
  const openJob = jobs.find((j) => j.id === openId) ?? null;

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="logo">DJ</div>
          <div>
            <h1>DevJobs Board</h1>
            <p>
              Angular · C# .NET — từ group Facebook &amp; job online ·{' '}
              <span className={'sync' + (sync === 'error' ? ' bad' : '')}>
                {sync === 'saving' ? 'Đang lưu…' : sync === 'error' ? '⚠ Chưa lưu được' : '☁ Đã lưu vào DB'}
              </span>{' '}
              ·{' '}
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  await api.logout().catch(() => {});
                  setStatus('login');
                }}
              >
                Đăng xuất
              </a>
            </p>
          </div>
        </div>
        <div className="stats">
          {(
            [
              ['Tổng job', jobs.length],
              ['Mới', count(0)],
              ['Quan tâm', count(1)],
              ['Đã ứng tuyển', count(2)],
              ['Phỏng vấn', count(3)],
              ['Offer', count(4)],
            ] as [string, number][]
          ).map(([l, v]) => (
            <div className="stat" key={l}>
              <b>{v}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </header>

      <nav className="nav">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
            {k === 'new' && count(0) > 0 && <span className="navcount">{count(0)}</span>}
          </button>
        ))}
      </nav>

      {tab === 'new' && <NewJobs jobs={jobs} onOpen={setOpenId} onMove={move} onAdd={add} onReseed={reseed} />}
      {tab === 'board' && <BoardTab jobs={jobs} onOpen={setOpenId} onMove={move} onRemove={remove} />}
      {tab === 'online' && <OnlineJobs onAdd={add} />}
      {tab === 'sites' && <SitesTab onGoOnline={() => setTab('online')} />}
      {tab === 'paste' && <PasteTab onAdd={add} />}

      {openJob && (
        <JobDrawer key={openJob.id} job={openJob} onClose={closeDrawer} onPatch={patch} onMove={move} onDelete={remove} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Inner />
      </ConfirmProvider>
    </ToastProvider>
  );
}
