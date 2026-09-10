export default function StatCard({ label, value, subtext, tone = 'default' }) {
  const toneClasses = {
    default: 'text-slate-900 dark:text-slate-100',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
    </div>
  );
}
