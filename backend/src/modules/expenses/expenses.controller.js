const service = require('./expenses.service');
const asyncHandler = require('../../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await service.list(req.userId, req.query);
  res.json(result);
});

const getOne = asyncHandler(async (req, res) => {
  const expense = await service.getOne(req.userId, req.params.id);
  res.json({ expense });
});

const create = asyncHandler(async (req, res) => {
  const expense = await service.create(req.userId, req.body);
  res.status(201).json({ expense });
});

const update = asyncHandler(async (req, res) => {
  const expense = await service.update(req.userId, req.params.id, req.body);
  res.json({ expense });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.userId, req.params.id);
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
