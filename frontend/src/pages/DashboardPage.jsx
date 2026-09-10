import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import BudgetProgress from '../components/BudgetProgress';
import MonthComparisonCard from '../components/MonthComparisonCard';
import DailySpendingChart from '../components/charts/DailySpendingChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { formatINR, formatDate } from '../utils/format';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, insightsRes] = await Promise.all([
        analyticsApi.dashboard(),
        analyticsApi.insights(),
      ]);
      setData(dashboard);
      setInsights(insightsRes.insights);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <EmptyState title="Could not load dashboard" description={error} />;

  const budget = data.monthlyBudget;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Here's how your spending looks right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Spent Today" value={formatINR(data.spentToday)} />
        <StatCard label="Spent This Week" value={formatINR(data.spentThisWeek)} />
        <StatCard label="Spent This Month" value={formatINR(data.spentThisMonth)} />
        <StatCard label="Transactions This Month" value={data.transactionsThisMonth} />
        <StatCard label="Monthly Budget" value={budget.budgetAmount ? formatINR(budget.budgetAmount) : 'Not set'} />
        <StatCard
          label="Remaining Budget"
          value={budget.remaining !== null ? formatINR(budget.remaining) : '—'}
          tone={budget.remaining !== null && budget.remaining < 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Budget Used %"
          value={budget.budgetAmount ? `${budget.percentUsed}%` : '—'}
          tone={budget.status === 'Exceeded' ? 'danger' : budget.status === 'High' ? 'warning' : 'default'}
        />
        <StatCard
          label="Highest Spending Category"
          value={data.highestCategory ? `${data.highestCategory.icon} ${data.highestCategory.name}` : '—'}
          subtext={data.highestCategory ? formatINR(data.highestCategory.amount) : ''}
        />
      </div>

      {budget.budgetAmount && (
        <BudgetProgress
          label={`Monthly Budget`}
          budgetAmount={budget.budgetAmount}
          spend={budget.spend}
          remaining={budget.remaining}
          percentUsed={budget.percentUsed}
          status={budget.status}
        />
      )}

      {insights.length > 0 && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 p-4">
          <p className="font-medium text-indigo-800 dark:text-indigo-200">Spending Insights</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-indigo-900 dark:text-indigo-100">
            {insights.map((text) => <li key={text}>{text}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="mb-2 font-medium">Daily Spending Trend</p>
          <DailySpendingChart data={data.dailyTrend} />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="mb-2 font-medium">Category Breakdown</p>
          <CategoryPieChart data={data.categoryBreakdown} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="mb-3 font-medium">Top 5 Spending Categories</p>
          {data.topCategories.length === 0 ? (
            <EmptyState title="No spending yet" description="Add your first expense to see category rankings." />
          ) : (
            <ul className="space-y-2">
              {data.topCategories.map((c) => (
                <li key={c.categoryId} className="flex items-center justify-between text-sm">
                  <span>{c.icon} {c.name}</span>
                  <span className="font-medium">{formatINR(c.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <MonthComparisonCard comparison={data.monthlyComparison} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">Recent Transactions</p>
          <Link to="/expenses" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Your recent expenses will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{tx.category_icon} {tx.description || tx.category_name}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.expense_date)} · {tx.payment_method}</p>
                </div>
                <span className="font-medium">{formatINR(tx.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
