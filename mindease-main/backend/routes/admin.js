const express = require('express');
const { getMetrics, getAlerts } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/metrics', protect, authorize('admin'), getMetrics);
router.get('/alerts', protect, authorize('admin', 'counsellor'), getAlerts);

module.exports = router;
