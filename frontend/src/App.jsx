import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AddExpenseProvider } from './context/AddExpenseContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetsPage from './pages/BudgetsPage';
import CategoriesPage from './pages/CategoriesPage';
import RecurringPage from './pages/RecurringPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AddExpenseProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="recurring" element={<RecurringPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </AddExpenseProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
