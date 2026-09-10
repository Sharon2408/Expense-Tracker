import { useState } from 'react';
import CategorySelector from './CategorySelector';
import { todayISO } from '../utils/format';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export default function ExpenseForm({ categories, initialValues, onSubmit, onCancel, submitLabel = 'Add Expense' }) {
  const [form, setForm] = useState({
    amount: initialValues?.amount ?? '',
    categoryId: initialValues?.categoryId ?? '',
    description: initialValues?.description ?? '',
    expenseDate: initialValues?.expenseDate ?? todayISO(),
    paymentMethod: initialValues?.paymentMethod ?? 'UPI',
    notes: initialValues?.notes ?? '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const nextErrors = {};
    const amountNum = Number(form.amount);
    if (form.amount === '' || form.amount === null) nextErrors.amount = 'Amount is required';
    else if (Number.isNaN(amountNum)) nextErrors.amount = 'Amount must be numeric';
    else if (amountNum <= 0) nextErrors.amount = 'Amount must be greater than zero';

    if (!form.categoryId) nextErrors.categoryId = 'Category is required';
    if (!form.expenseDate) nextErrors.expenseDate = 'Expense date is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
    } catch (err) {
      if (err.details) setErrors(err.details);
      else setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Amount (₹)
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={form.amount}
          onChange={(e) => update('amount', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          aria-invalid={!!errors.amount}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
        </label>
        <div className="mt-1">
          <CategorySelector categories={categories} value={form.categoryId} onChange={(v) => update('categoryId', v)} />
        </div>
        {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Description
        </label>
        <input
          id="description"
          type="text"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Expense Date
          </label>
          <input
            id="expenseDate"
            type="date"
            value={form.expenseDate}
            onChange={(e) => update('expenseDate', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
          {errors.expenseDate && <p className="mt-1 text-xs text-red-600">{errors.expenseDate}</p>}
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            value={form.paymentMethod}
            onChange={(e) => update('paymentMethod', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
