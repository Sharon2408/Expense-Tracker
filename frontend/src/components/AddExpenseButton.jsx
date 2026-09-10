import { useAddExpense } from '../context/AddExpenseContext';

export default function AddExpenseButton({ className = '', onSaved }) {
  const { openAddExpense } = useAddExpense();

  return (
    <button
      type="button"
      onClick={() => openAddExpense(onSaved)}
      className={`inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 ${className}`}
    >
      <span aria-hidden="true">+</span> Add Expense
    </button>
  );
}
