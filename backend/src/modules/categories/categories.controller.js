const service = require('./categories.service');
const asyncHandler = require('../../utils/asyncHandler');
const { PAYMENT_METHODS } = require('../../utils/categories');

const list = asyncHandler(async (req, res) => {
  const categories = await service.list(req.userId);
  res.json({ categories, paymentMethods: PAYMENT_METHODS });
});

const create = asyncHandler(async (req, res) => {
  const category = await service.create(req.userId, req.body);
  res.status(201).json({ category });
});

const update = asyncHandler(async (req, res) => {
  const category = await service.update(req.userId, req.params.id, req.body);
  res.json({ category });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.userId, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
