const express = require('express');
const { getLogs } = require('../controllers/notification.controller');
const { requireAuth, requireAdmin } = require('../middleware/entraAuth');

const router = express.Router();

router.get('/logs', requireAuth, requireAdmin, getLogs);

module.exports = router;
