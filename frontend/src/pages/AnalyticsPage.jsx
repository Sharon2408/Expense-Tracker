import { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import { formatINR, formatDate, MONTH_NAMES } from '../utils/format';

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

export default function AnalyticsPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([analyticsApi.monthly(year, month), analyticsApi.trend(6)])
      .then(([monthly, trendRes]) => {
        setData(monthly);
        setTrend(trendRes.trend);
      })
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [year, month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
          >
            {MONTH_NAMES.map((name, idx) => <option key={name} value={idx + 1}>{name}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading && <LoadingState label="Crunching numbers…" />}
      {error && <EmptyState title="Could not load analytics" description={error} />}

      {!loading && !error && data && (
        <>
          {data.transactionCount === 0 ? (
            <EmptyState title={`No expenses in ${MONTH_NAMES[month - 1]} ${year}`} description="Try a different month, or add some expenses." />
          ) : (
            <>
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 p-4">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">What did I spend the most money on this month?</p>
                <p className="mt-1 text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  {data.highestSpendingCategory ? `${data.highestSpendingCategory.icon} ${data.highestSpendingCategory.name} — ${formatINR(data.highestSpendingCategory.amount)}` : '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard label="Total Spending" value={formatINR(data.totalSpending)} />
                <StatCard label="Average Daily Spending" value={formatINR(data.averageDailySpending)} />
                <StatCard label="Number of Transactions" value={data.transactionCount} />
                <StatCard
                  label="Highest Spending Day"
                  value={data.highestSpendingDay ? formatDate(data.highestSpendingDay.date) : '—'}
                  subtext={data.highestSpendingDay ? formatINR(data.highestSpendingDay.amount) : ''}
                />
                <StatCard
                  label="Largest Expense"
                  value={data.largestExpense ? formatINR(data.largestExpense.amount) : '—'}
                  subtext={data.largestExpense?.description}
                />
                <StatCard
                  label="Highest Spending Category"
                  value={data.highestSpendingCategory ? data.highestSpendingCategory.name : '—'}
                />
                <StatCard
                  label="Most-used Payment Method"
                  value={data.mostUsedPaymentMethod ? data.mostUsedPaymentMethod.paymentMethod : '—'}
                  subtext={data.mostUsedPaymentMethod ? `${data.mostUsedPaymentMethod.count} transactions` : ''}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <p className="mb-2 font-medium">Category Breakdown</p>
                  <CategoryPieChart data={data.categoryBreakdown} />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <p className="mb-2 font-medium">Monthly Spending Trend (last 6 months)</p>
                  <MonthlyTrendChart data={trend} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                <p className="mb-3 font-medium">Category Breakdown</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-1">Category</th>
                      <th className="py-1 text-right">Amount</th>
                      <th className="py-1 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryBreakdown.map((c) => (
                      <tr key={c.categoryId} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-1.5">{c.icon} {c.name}</td>
                        <td className="py-1.5 text-right">{formatINR(c.amount)}</td>
                        <td className="py-1.5 text-right">{c.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
