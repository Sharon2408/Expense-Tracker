# Personal Expense Tracker

A full-stack personal expense tracker for recording day-to-day expenses, tracking budgets, and understanding spending patterns — built with Indian Rupee (₹) formatting throughout.

## 1. Technology Stack

- **Frontend:** React 18 + Vite, React Router, Tailwind CSS, Recharts.
- **Backend:** Node.js + Express (REST API).
- **Database:** PostgreSQL, plain SQL migrations (no ORM).
- **Auth:** JWT access tokens (15 min) + rotating refresh tokens (httpOnly cookie, 30 days), bcrypt password hashing.

**Why this stack over Next.js + Supabase:** Supabase Auth/RLS is fast to start with but couples the app to Supabase's hosted platform. A plain Express API keeps auth and business logic (budgets, analytics, insights) in code that's easy to test, self-host, and reuse as-is for a future React Native mobile client, without any vendor migration.

## 2. Architecture

```
Frontend (React)
   │  src/api/*Api.js  (service layer — the only place that knows the backend's URL shape)
   ▼
Backend REST API (Express)
   │  routes → controllers (thin) → services (business logic + SQL) 
   ▼
PostgreSQL
```

Each layer can be replaced independently: swap `src/api/*` to talk to a different backend without touching components; swap Postgres access in a service without touching controllers/routes.

### Backend folder structure
```
backend/src/
  app.js, server.js        Express app wiring, global middleware
  config/env.js            Typed env var access
  db/pool.js                pg Pool
  db/migrations/*.sql       Plain SQL migrations, run in filename order
  middleware/               requireAuth, errorHandler
  modules/<feature>/         auth, categories, expenses, budgets, recurring, analytics, importExport
    <feature>.routes.js      Route definitions only
    <feature>.controller.js  Thin: parse req, call service, shape response
    <feature>.service.js     Business logic + SQL, always scoped by userId
    <feature>.validation.js  Input validation (expenses module)
  scripts/migrate.js, seed.js
  utils/                    money.js, dates.js, categories.js, apiError.js, asyncHandler.js
```

### Frontend folder structure
```
frontend/src/
  api/            expenseApi, categoryApi, budgetApi, analyticsApi, recurringApi, dataApi, authApi, httpClient
  components/     StatCard, ExpenseForm, ExpenseTable, CategorySelector, DateFilter, BudgetProgress,
                   ConfirmDialog, EmptyState, LoadingState, Modal, AddExpenseButton/Modal, charts/*
  context/        AuthContext, ThemeContext, AddExpenseContext
  layouts/        AppLayout (nav + header + Add Expense button)
  pages/          LoginPage, SignupPage, DashboardPage, ExpensesPage, AnalyticsPage, BudgetsPage,
                   CategoriesPage, RecurringPage, SettingsPage
  utils/          format.js (₹ formatting, dates)
```

## 3. Database Schema

- **users** — id, name, email (unique), password_hash, currency, theme, default_payment_method.
- **refresh_tokens** — hashed refresh tokens per user, for rotation/revocation.
- **categories** — per-user; `is_default` seeded at signup; `UNIQUE(user_id, name)`.
- **expenses** — user_id, category_id, `amount NUMERIC(12,2) CHECK (amount > 0)`, expense_date, payment_method, notes, optional `recurring_expense_id` link.
- **monthly_budgets** — `UNIQUE(user_id, year, month)` — one budget per user per month.
- **category_budgets** — `UNIQUE(user_id, category_id, year, month)` — one budget per category per month.
- **recurring_expenses** — frequency (weekly/monthly/quarterly/yearly), start/end/next_due_date, is_active.

All money columns are `NUMERIC(12,2)` — never JS floats are used as the storage representation. Indexes exist on `expenses(user_id, expense_date)`, `expenses(user_id, category_id)`, `categories(user_id)`, `recurring_expenses(user_id)`, and a partial index on due recurring expenses.

## 4. Authentication

- Signup hashes the password with bcrypt (cost 10) and seeds the 15 default categories for the new user.
- Login issues a short-lived JWT access token (returned in the response body, held in memory on the frontend) and a long-lived refresh token (httpOnly, `SameSite=Lax` cookie, scoped to `/api/auth`).
- `POST /api/auth/refresh` rotates the refresh token (old one is revoked, a new one issued) and returns a fresh access token. The frontend's `httpClient` calls this automatically on any 401 from a data route (once, guarded against loops) and retries the original request, so both a browser refresh and a mid-session access-token expiry keep the user logged in without re-entering credentials — the user is only logged out once the 30-day refresh cookie itself is gone or revoked.
- Every data route (`/api/expenses`, `/api/categories`, `/api/budgets`, `/api/recurring-expenses`, `/api/analytics`, `/api/data`) is mounted behind `requireAuth` in `app.js`, which decodes the access token and sets `req.userId` — **every service query uses `req.userId`, never a user id from the request body/query**, so User A can never read or modify User B's data.

## 5. Environment Variables

Copy the example files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`backend/.env`):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Random long strings — generate with `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `CORS_ORIGIN` | Frontend origin allowed to call the API |
| `PORT`, `NODE_ENV` | Server port / environment |

Frontend (`frontend/.env`):
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

Never commit real `.env` files or secrets — only `.env.example` is tracked.

## 6. Database Setup

Start Postgres with Docker Compose:
```bash
docker compose up -d
```
This starts Postgres 16 on `localhost:5432` with the credentials already matching `backend/.env.example`.

(No Docker? Point `DATABASE_URL` at any Postgres 14+ instance instead.)

Run migrations:
```bash
cd backend
npm run migrate
```

Optional: seed development sample data (current + previous month, multiple categories, a demo login):
```bash
npm run seed
```
This prints a demo login (`demo@expensetracker.test` / `Demo@12345`). The seed script refuses to run when `NODE_ENV=production`.

## 7. Development Setup

**Backend:**
```bash
cd backend
npm install
npm run dev      # http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

**Tests (backend):**
```bash
cd backend
npm test
```
Covers: safe percentage/rounding math, month-over-month calculation edge cases (zero baseline), signup/login/duplicate-email/wrong-password, protected-route auth, expense validation (zero/negative/non-numeric amount, missing category), full expense CRUD, **cross-user isolation** (User B cannot read/delete User A's expense or see it in their list), and budget/category-budget percentage calculations.

## 8. Build

```bash
cd frontend
npm run build   # outputs frontend/dist
```
The backend has no separate build step (plain Node/Express); run it with `npm start` in production.

## 9. Main Features Implemented

- Signup / login / logout, session persists across browser refresh via refresh-token rotation.
- Full expense CRUD with validation, search, category/payment-method filters, quick date ranges + custom range, sorting, pagination, delete confirmation.
- Custom categories in addition to 15 seeded defaults; categories in use can't be deleted.
- Dashboard: spent today/week/month, budget/remaining/%, highest category, top 5 categories, recent transactions, daily trend chart, category donut chart, month-over-month comparison (text + numbers, not color-only).
- Analytics page: month/year picker, total/average/transaction count, highest spending day, largest expense, most-used payment method, category breakdown table with %, category pie chart, 6-month trend line chart.
- Monthly budgets (one per user per month) and optional per-category budgets, both with Normal/Warning/High/Exceeded status shown as color **and** text.
- Recurring expenses (weekly/monthly/quarterly/yearly) with a manual "generate due" action that creates expense rows and advances `next_due_date`, duplicate-safe via a partial unique index — see "Recurring expense automation" below for wiring up a real scheduler.
- Spending Insights generated purely from SQL aggregates (no AI call), only shown once there's enough data.
- CSV export (date range), JSON full backup export, CSV import with per-row validation and best-effort duplicate detection.
- Settings: profile, default payment method, light/dark/system theme (persisted, respects OS preference).
- Responsive layout (collapsible nav on mobile, floating Add Expense button on small screens).

## 10. Recurring Expense Automation

`POST /api/recurring-expenses/generate-due` runs `generateDueExpenses()` (`backend/src/modules/recurring/recurring.service.js`), which:
1. Finds the caller's active rules whose `next_due_date <= CURRENT_DATE`.
2. Inserts an expense row per due rule (idempotent: `UNIQUE(recurring_expense_id, expense_date)` means re-running the same day is a no-op).
3. Advances `next_due_date` by the rule's frequency, deactivating the rule once `end_date` is passed.

Currently this runs on-demand only (called from the Recurring Expenses page, or by hand). To automate it, add a scheduled job (cron, a cloud scheduler, or `node-cron` inside the Node process) that, once daily, loops over all users and calls the equivalent of this function — the database structure and idempotency guarantee are already in place; only the "loop over all users on a timer" wiring is left.

## 11. Test Credentials (after `npm run seed`)

- Email: `demo@expensetracker.test`
- Password: `Demo@12345`

## 12. Known Limitations

- No email verification or password-reset flow (out of scope for v1).
- Recurring expenses require a manual trigger (or an externally-added cron) rather than a built-in background worker — see section 10.
- CSV import matches categories by exact name (case-insensitive); it does not fuzzy-match or auto-create unknown categories.
- Single currency (INR) — no multi-currency conversion, by design for v1.
- No bank/UPI integration, receipt OCR, or AI-based insights — insights are rule-based, not AI-generated, by design.
"# Expense-Tracker" 
