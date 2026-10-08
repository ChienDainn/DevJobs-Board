export function downloadCsv(filename: string, rows: Record<string, unknown>[], cols: string[]) {
  const q = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
