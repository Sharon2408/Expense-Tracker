import { useEffect, useState } from 'react';
import { recurringApi } from '../api/recurringApi';
import { categoryApi } from '../api/categoryApi';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import CategorySelector from '../components/CategorySelector';
import { formatINR, formatDate, todayISO } from '../utils/format';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export default function RecurringPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    categoryId: '',
    paymentMethod: 'UPI',
    frequency: 'monthly',
    startDate: todayISO(),
    endDate: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [rec, cats] = await Promise.all([recurringApi.list(), categoryApi.list()]);
      setItems(rec.items);
      setCategories(cats.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await recurringApi.create({ ...form, amount: Number(form.amount), endDate: form.endDate || null });
      setForm({ description: '', amount: '', categoryId: '', paymentMethod: 'UPI', frequency: 'monthly', startDate: todayISO(), endDate: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (item) => {
    await recurringApi.update(item.id, { isActive: !item.is_active });
    load();
  };

  const handleDeleteConfirmed = async () => {
    await recurringApi.remove(deleting.id);
    setDeleting(null);
    load();
  };

  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');

  const handleGenerateDue = async () => {
    setGenerating(true);
    setGenerateMessage('');
    try {
      const { generated } = await recurringApi.generateDue();
      setGenerateMessage(
        generated.length > 0
          ? `Generated ${generated.length} expense(s) from due recurring rules.`
          : 'No recurring expenses are due right now.',
      );
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingState label="Loading recurring expenses…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Recurring Expenses</h1>
          <p className="text-sm text-slate-500">
            No background scheduler is wired up yet (see README) - use this button to generate any expenses that are due.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateDue}
          disabled={generating}
          className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate Due Expenses Now'}
        </button>
      </div>
      {generateMessage && <p className="text-sm text-emerald-600">{generateMessage}</p>}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Add Recurring Expense</p>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Description (e.g. Netflix, Rent)"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount (₹)"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <CategorySelector categories={categories} value={form.categoryId} onChange={(v) => update('categoryId', v)} />
          <select
            value={form.paymentMethod}
            onChange={(e) => update('paymentMethod', e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={form.frequency}
            onChange={(e) => update('frequency', e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
          </select>
          <div>
            <label htmlFor="startDate" className="block text-xs text-slate-500">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-xs text-slate-500">End Date (optional)</label>
            <input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:col-span-2">
            Add Recurring Expense
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No recurring expenses yet" description="Add rent, subscriptions, EMIs or other repeating expenses above." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Frequency</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Next Due</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2">{item.category_icon} {item.category_name}</td>
                  <td className="px-4 py-2 capitalize">{item.frequency}</td>
                  <td className="px-4 py-2 text-right">{formatINR(item.amount)}</td>
                  <td className="px-4 py-2">{formatDate(item.next_due_date)}</td>
                  <td className="px-4 py-2">
                    <span className={item.is_active ? 'text-emerald-600' : 'text-slate-400'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => toggleActive(item)} className="mr-2 text-indigo-600 hover:underline">
                      {item.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button type="button" onClick={() => setDeleting(item)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete recurring expense?"
        message={deleting ? `Delete the recurring rule for "${deleting.description}"? Already-generated expenses are not affected.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
