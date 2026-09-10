import { formatDate, formatINR } from '../utils/format';
import EmptyState from './EmptyState';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return <EmptyState title="No expenses found" description="Try adjusting your filters, or add a new expense." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Category</th>
            <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Payment</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatDate(e.expense_date)}</td>
              <td className="px-4 py-2 text-slate-800 dark:text-slate-100">{e.description || '—'}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                {e.category_icon} {e.category_name}
              </td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{e.payment_method}</td>
              <td className="px-4 py-2 text-right font-medium text-slate-900 dark:text-slate-100">
                {formatINR(e.amount)}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  className="mr-2 text-indigo-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(e)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
