import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../EmptyState';
import { formatINR, MONTH_NAMES } from '../../utils/format';

export default function MonthlyTrendChart({ data }) {
  const hasSpending = data && data.some((d) => d.total > 0);
  if (!hasSpending) {
    return <EmptyState title="Not enough history yet" description="Spending trends will appear after a couple of months of data." />;
  }

  const chartData = data.map((d) => ({ ...d, label: `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${String(d.year).slice(-2)}` }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={40} />
        <Tooltip formatter={(value) => formatINR(value)} />
        <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
