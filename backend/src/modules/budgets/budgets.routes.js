const express = require('express');
const controller = require('./budgets.controller');

const router = express.Router();

router.get('/monthly/:year/:month', controller.getMonthly);
router.put('/monthly/:year/:month', controller.putMonthly);
router.get('/category', controller.listCategoryBudgets);
router.put('/category', controller.upsertCategoryBudget);
router.delete('/category/:id', controller.removeCategoryBudget);

module.exports = router;
