import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAddExpense } from '../context/AddExpenseContext';
import AddExpenseButton from '../components/AddExpenseButton';
import AddExpenseModal from '../components/AddExpenseModal';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/categories', label: 'Categories' },
  { to: '/recurring', label: 'Recurring Expenses' },
  { to: '/settings', label: 'Settings' },
];

function navLinkClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { openAddExpense } = useAddExpense();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-indigo-600">₹ Expense Tracker</span>
        <div className="flex items-center gap-3">
          <AddExpenseButton className="hidden sm:inline-flex" />
          <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <nav
          className={`${menuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]`}
        >
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <button
        type="button"
        onClick={() => openAddExpense()}
        className="fixed bottom-5 right-5 z-30 rounded-full bg-indigo-600 p-4 text-white shadow-lg sm:hidden"
        aria-label="Add Expense"
      >
        +
      </button>

      <AddExpenseModal />
    </div>
  );
}
