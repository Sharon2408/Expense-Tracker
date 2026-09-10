import { formatINR } from '../utils/format';

const STATUS_STYLES = {
  Normal: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'On track' },
  Warning: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Approaching limit' },
  High: { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', label: 'Nearly exceeded' },
  Exceeded: { bar: 'bg-red-600', text: 'text-red-600 dark:text-red-400', label: 'Over budget' },
};

export default function BudgetProgress({ label, budgetAmount, spend, remaining, percentUsed, status }) {
  if (budgetAmount === null || budgetAmount === undefined) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-sm text-slate-500">
        No budget set for {label || 'this period'}.
      </div>
    );
  }

  const style = STATUS_STYLES[status] || STATUS_STYLES.Normal;
  const widthPct = Math.min(percentUsed, 100);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
        {/* Status is shown as both color and text, so it's never color-only. */}
        <span className={`text-xs font-semibold ${style.text}`}>
          {status} · {style.label}
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={`h-2.5 rounded-full ${style.bar}`} style={{ width: `${widthPct}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-slate-400">Budget</p>
          <p className="font-medium text-slate-800 dark:text-slate-100">{formatINR(budgetAmount)}</p>
        </div>
        <div>
          <p className="text-slate-400">Spent</p>
          <p className="font-medium text-slate-800 dark:text-slate-100">{formatINR(spend)}</p>
        </div>
        <div>
          <p className="text-slate-400">Remaining</p>
          <p className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
            {formatINR(remaining)}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{percentUsed}% used</p>
    </div>
  );
}
