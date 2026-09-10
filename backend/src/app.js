const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { requireAuth } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const expensesRoutes = require('./modules/expenses/expenses.routes');
const budgetsRoutes = require('./modules/budgets/budgets.routes');
const recurringRoutes = require('./modules/recurring/recurring.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const importExportRoutes = require('./modules/importExport/importExport.routes');

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

// Every route below requires a verified access token; req.userId is derived
// from it inside requireAuth, so per-user scoping happens once, here, rather
// than being re-implemented (and possibly forgotten) in each module.
app.use('/api/categories', requireAuth, categoriesRoutes);
app.use('/api/expenses', requireAuth, expensesRoutes);
app.use('/api/budgets', requireAuth, budgetsRoutes);
app.use('/api/recurring-expenses', requireAuth, recurringRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/data', requireAuth, importExportRoutes);

const path = require('path');

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');

  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
