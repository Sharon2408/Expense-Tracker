const express = require('express');
const controller = require('./auth.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);
router.put('/settings', requireAuth, controller.updateSettings);

module.exports = router;
