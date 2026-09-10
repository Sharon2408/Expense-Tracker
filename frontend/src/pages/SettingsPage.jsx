import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dataApi } from '../api/dataApi';
import { authApi } from '../api/authApi';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(user?.defaultPaymentMethod || 'UPI');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const { user: updated } = await authApi.updateSettings({ name, defaultPaymentMethod });
      updateUser(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    try {
      const result = await dataApi.importCsv(file);
      setImportResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Profile</p>
        {message && <p className="mb-2 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm text-slate-500">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500">Currency</label>
            <input
              type="text"
              value="INR (₹)"
              disabled
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="defaultPayment" className="block text-sm text-slate-500">Default Payment Method</label>
            <select
              id="defaultPayment"
              value={defaultPaymentMethod}
              onChange={(e) => setDefaultPaymentMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Profile
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Theme</p>
        <div className="flex gap-2">
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                theme === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-3 font-medium">Data Export &amp; Import</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dataApi.exportCsv()} className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white">
            Export CSV
          </button>
          <button type="button" onClick={() => dataApi.exportJson()} className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white">
            Export JSON Backup
          </button>
          <label className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium cursor-pointer">
            Import CSV
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {importResult && (
          <div className="mt-3 text-sm">
            <p>Imported: {importResult.imported}, Skipped: {importResult.skipped}</p>
            {importResult.errors?.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-red-600">
                {importResult.errors.map((e) => (
                  <li key={e.row}>Row {e.row}: {Object.values(e.errors).join(', ')}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
