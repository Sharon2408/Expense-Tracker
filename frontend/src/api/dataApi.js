import { http } from './httpClient';

async function downloadViaAuthedFetch(path, filename) {
  const res = await http.raw(path);
  if (!res.ok) {
    throw new Error('Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toQueryString(params) {
  const usable = Object.entries(params || {}).filter(([, v]) => v);
  if (usable.length === 0) return '';
  return `?${new URLSearchParams(usable).toString()}`;
}

export const dataApi = {
  exportCsv: (from, to) => downloadViaAuthedFetch(`/data/export/csv${toQueryString({ from, to })}`, 'expenses.csv'),
  exportJson: () => downloadViaAuthedFetch('/data/export/json', 'expense-backup.json'),
  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/data/import/csv', formData, { isForm: true });
  },
};
