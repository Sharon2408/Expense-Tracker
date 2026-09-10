import { useEffect, useState, useCallback } from 'react';
import { expenseApi } from '../api/expenseApi';
import { categoryApi } from '../api/categoryApi';
import ExpenseTable from '../components/ExpenseTable';
import DateFilter, { resolveQuickRange } from '../components/DateFilter';
import LoadingState from '../components/LoadingState';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import AddExpenseButton from '../components/AddExpenseButton';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [dateRange, setDateRange] = useState(resolveQuickRange('thisMonth'));
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await expenseApi.list({
        from: dateRange.from,
        to: dateRange.to,
        categoryId,
        paymentMethod,
        search,
        sort,
        page,
        pageSize,
      });
      setExpenses(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [dateRange, categoryId, paymentMethod, search, sort, page]);

  useEffect(() => {
    categoryApi.list().then((res) => setCategories(res.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (values) => {
    await expenseApi.update(editing.id, values);
    setEditing(null);
    load();
  };

  const handleDeleteConfirmed = async () => {
    await expenseApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <AddExpenseButton onSaved={load} />
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <DateFilter onChange={(range) => { setDateRange(range); setPage(1); }} />
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search description or notes"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          />
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <ExpenseTable expenses={expenses} onEdit={setEditing} onDelete={setDeleting} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Page {page} of {totalPages} · {total} expenses
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={!!editing} title="Edit Expense" onClose={() => setEditing(null)}>
        {editing && (
          <ExpenseForm
            categories={categories}
            submitLabel="Save Changes"
            initialValues={{
              amount: editing.amount,
              categoryId: editing.category_id,
              description: editing.description,
              expenseDate: editing.expense_date?.slice(0, 10),
              paymentMethod: editing.payment_method,
              notes: editing.notes,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete expense?"
        message={deleting ? `This will permanently delete "${deleting.description || deleting.category_name}" (₹${deleting.amount}). This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
