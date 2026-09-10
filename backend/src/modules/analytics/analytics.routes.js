const express = require('express');
const controller = require('./analytics.controller');

const router = express.Router();

router.get('/dashboard', controller.dashboard);
router.get('/monthly', controller.monthly);
router.get('/trend', controller.trend);
router.get('/insights', controller.insights);

module.exports = router;
