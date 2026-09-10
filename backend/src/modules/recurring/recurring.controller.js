const service = require('./recurring.service');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const items = await service.list(req.userId);
  res.json({ items, frequencies: service.FREQUENCIES });
});

const create = asyncHandler(async (req, res) => {
  const item = await service.create(req.userId, req.body);
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const item = await service.update(req.userId, req.params.id, req.body);
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.userId, req.params.id);
  res.status(204).send();
});

// Manual trigger for the generation logic described in the README, so the
// feature is usable end-to-end before a real cron/scheduler is wired up.
const generateDue = asyncHandler(async (req, res) => {
  const generated = await service.generateDueExpenses(req.userId);
  res.json({ generated });
});

module.exports = { list, create, update, remove, generateDue };
