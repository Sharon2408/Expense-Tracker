import { useEffect, useState } from 'react';
import { budgetApi } from '../api/budgetApi';
import { categoryApi } from '../api/categoryApi';
import BudgetProgress from '../components/BudgetProgress';
import LoadingState from '../components/LoadingState';
import { MONTH_NAMES } from '../utils/format';

const now = new Date();

export default function BudgetsPage() {
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [budget, catBudgets, cats] = await Promise.all([
        budgetApi.getMonthly(year, month),
        budgetApi.listCategoryBudgets(year, month),
        categoryApi.list(),
      ]);
      setMonthlyBudget(budget.budget);
      setAmountInput(budget.budget.budgetAmount || '');
      setCategoryBudgets(catBudgets.budgets);
      setCategories(cats.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveMonthly = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await budgetApi.setMonthly(year, month, Number(amountInput));
      setMonthlyBudget(res.budget);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCategoryBudget = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCategoryId || !newCategoryAmount) return;
    try {
      await budgetApi.upsertCategoryBudget({ categoryId: newCategoryId, year, month, amount: Number(newCategoryAmount) });
      setNewCategoryId('');
      setNewCategoryAmount('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveCategoryBudget = async (id) => {
    await budgetApi.removeCategoryBudget(id);
    load();
  };

  if (loading) return <LoadingState label="Loading budgets…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-sm text-slate-500">{MONTH_NAMES[month - 1]} {year}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Monthly Budget</p>
        <form onSubmit={handleSaveMonthly} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="monthlyAmount" className="block text-sm text-slate-500">Amount (₹)</label>
            <input
              id="monthlyAmount"
              type="number"
              min="1"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save
          </button>
        </form>
      </div>

      {monthlyBudget?.budgetAmount && (
        <BudgetProgress
          label="Overall Monthly Budget"
          budgetAmount={monthlyBudget.budgetAmount}
          spend={monthlyBudget.spend}
          remaining={monthlyBudget.remaining}
          percentUsed={monthlyBudget.percentUsed}
          status={monthlyBudget.status}
        />
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Category Budgets</p>
        <form onSubmit={handleAddCategoryBudget} className="mb-4 flex flex-wrap items-end gap-2">
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Budget amount"
            value={newCategoryAmount}
            onChange={(e) => setNewCategoryAmount(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white">
            Add Budget
          </button>
        </form>

        {categoryBudgets.length === 0 ? (
          <p className="text-sm text-slate-400">No category budgets configured for this month yet.</p>
        ) : (
          <div className="space-y-3">
            {categoryBudgets.map((cb) => (
              <div key={cb.id} className="relative">
                <BudgetProgress
                  label={`${cb.categoryIcon} ${cb.categoryName}`}
                  budgetAmount={cb.budgetAmount}
                  spend={cb.spend}
                  remaining={cb.remaining}
                  percentUsed={cb.percentUsed}
                  status={cb.status}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCategoryBudget(cb.id)}
                  className="absolute right-4 top-4 text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
