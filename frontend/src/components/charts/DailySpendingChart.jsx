import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../EmptyState';
import { formatINR } from '../../utils/format';

export default function DailySpendingChart({ data }) {
  const hasSpending = data && data.some((d) => d.amount > 0);
  if (!hasSpending) {
    return <EmptyState title="No spending data yet" description="Add an expense to see your daily trend." />;
  }

  const chartData = data.map((d) => ({ ...d, day: d.date.slice(-2) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={40} />
        <Tooltip formatter={(value) => formatINR(value)} labelFormatter={(label) => `Day ${label}`} />
        <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
