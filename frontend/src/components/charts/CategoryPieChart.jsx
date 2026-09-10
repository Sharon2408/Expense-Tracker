import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import EmptyState from '../EmptyState';
import { formatINR } from '../../utils/format';

const COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No category data yet" description="Add expenses across categories to see a breakdown." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
          {data.map((entry, index) => (
            <Cell key={entry.categoryId || entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatINR(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
