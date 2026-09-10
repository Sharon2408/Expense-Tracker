import { useState } from 'react';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export function resolveQuickRange(key) {
  const now = new Date();
  const today = isoDate(now);

  if (key === 'today') return { from: today, to: today };

  if (key === 'thisWeek') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    return { from: isoDate(start), to: today };
  }

  if (key === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: isoDate(start), to: today };
  }

  if (key === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: isoDate(start), to: isoDate(end) };
  }

  if (key === 'last3Months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { from: isoDate(start), to: today };
  }

  return { from: '', to: '' };
}

const QUICK_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'last3Months', label: 'Last 3 Months' },
  { key: 'custom', label: 'Custom Range' },
];

export default function DateFilter({ onChange }) {
  const [active, setActive] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const selectQuick = (key) => {
    setActive(key);
    if (key === 'custom') {
      onChange({ from: customFrom, to: customTo });
    } else {
      onChange(resolveQuickRange(key));
    }
  };

  const applyCustom = () => {
    onChange({ from: customFrom, to: customTo });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUICK_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => selectQuick(opt.key)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            active === opt.key
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {active === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="rounded-lg bg-slate-200 dark:bg-slate-700 px-3 py-1 text-sm font-medium"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
