const service = require('./analytics.service');
const asyncHandler = require('../../utils/asyncHandler');

const dashboard = asyncHandler(async (req, res) => {
  const data = await service.dashboard(req.userId);
  res.json(data);
});

const monthly = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const data = await service.monthlyAnalytics(req.userId, year, month);
  res.json(data);
});

const trend = asyncHandler(async (req, res) => {
  const monthsBack = Number(req.query.months) || 6;
  const data = await service.monthlyTrend(req.userId, monthsBack);
  res.json({ trend: data });
});

const insights = asyncHandler(async (req, res) => {
  const data = await service.insights(req.userId);
  res.json({ insights: data });
});

module.exports = { dashboard, monthly, trend, insights };
