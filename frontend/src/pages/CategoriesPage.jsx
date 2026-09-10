import { useEffect, useState } from 'react';
import { categoryApi } from '../api/categoryApi';
import LoadingState from '../components/LoadingState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list();
      setCategories(res.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      await categoryApi.create({ name, icon });
      setName('');
      setIcon('💰');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      await categoryApi.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleting(null);
    }
  };

  if (loading) return <LoadingState label="Loading categories…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Add Custom Category</p>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            placeholder="Icon"
            maxLength={4}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-16 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-2 text-center text-sm"
          />
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Add Category
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <span className="text-sm">{c.icon} {c.name}</span>
            {!c.is_default && (
              <button type="button" onClick={() => setDeleting(c)} className="text-xs text-red-600 hover:underline">
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete category?"
        message={deleting ? `Delete "${deleting.name}"? Categories with existing expenses cannot be deleted.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
