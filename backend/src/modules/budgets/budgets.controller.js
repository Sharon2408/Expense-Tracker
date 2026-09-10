const service = require('./budgets.service');
const asyncHandler = require('../../utils/asyncHandler');

const getMonthly = asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const budget = await service.getMonthlyBudget(req.userId, Number(year), Number(month));
  res.json({ budget });
});

const putMonthly = asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const budget = await service.upsertMonthlyBudget(req.userId, Number(year), Number(month), req.body.amount);
  res.json({ budget });
});

const listCategoryBudgets = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const now = new Date();
  const budgets = await service.listCategoryBudgets(
    req.userId,
    Number(year) || now.getFullYear(),
    Number(month) || now.getMonth() + 1,
  );
  res.json({ budgets });
});

const upsertCategoryBudget = asyncHandler(async (req, res) => {
  const budget = await service.upsertCategoryBudget(req.userId, req.body);
  res.json({ budget });
});

const removeCategoryBudget = asyncHandler(async (req, res) => {
  await service.removeCategoryBudget(req.userId, req.params.id);
  res.status(204).send();
});

module.exports = { getMonthly, putMonthly, listCategoryBudgets, upsertCategoryBudget, removeCategoryBudget };
