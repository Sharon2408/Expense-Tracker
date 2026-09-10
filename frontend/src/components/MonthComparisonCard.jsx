import { formatINR, MONTH_NAMES } from '../utils/format';

export default function MonthComparisonCard({ comparison }) {
  if (!comparison) return null;
  const { currentMonth, previousMonth, difference, percentChange } = comparison;

  let direction = 'stayed about the same as';
  let icon = '→';
  let tone = 'text-slate-600 dark:text-slate-300';
  if (percentChange !== null) {
    if (percentChange > 2) {
      direction = 'increased compared with';
      icon = '↑';
      tone = 'text-red-600 dark:text-red-400';
    } else if (percentChange < -2) {
      direction = 'decreased compared with';
      icon = '↓';
      tone = 'text-emerald-600 dark:text-emerald-400';
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="font-medium text-slate-800 dark:text-slate-100">Monthly Comparison</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400">{MONTH_NAMES[previousMonth.month - 1]} {previousMonth.year}</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formatINR(previousMonth.total)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">{MONTH_NAMES[currentMonth.month - 1]} {currentMonth.year}</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formatINR(currentMonth.total)}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm font-medium ${tone}`}>
        {icon} Spending {direction} last month
        {' '}({difference >= 0 ? '+' : ''}{formatINR(difference)}
        {percentChange !== null ? `, ${percentChange >= 0 ? '+' : ''}${percentChange}%` : ''})
      </p>
    </div>
  );
}
