const express = require('express');
const { createAppointment, getAppointments, updateStatus } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createAppointment)
  .get(protect, getAppointments);

router.route('/:id/status')
  .put(protect, authorize('counsellor', 'admin'), updateStatus);

module.exports = router;
