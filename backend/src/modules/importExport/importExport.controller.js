const service = require('./importExport.service');
const asyncHandler = require('../../utils/asyncHandler');

const exportCsv = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const csv = await service.exportCsv(req.userId, from, to);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(csv);
});

const exportJson = asyncHandler(async (req, res) => {
  const data = await service.exportJson(req.userId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="expense-backup.json"');
  res.json(data);
});

const importCsv = asyncHandler(async (req, res) => {
  const csvText = req.file ? req.file.buffer.toString('utf8') : req.body.csv;
  const result = await service.importCsv(req.userId, csvText || '');
  res.json(result);
});

module.exports = { exportCsv, exportJson, importCsv };
