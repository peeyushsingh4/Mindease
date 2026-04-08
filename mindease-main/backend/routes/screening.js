const express = require('express');
const { submitScreening, getScreenings } = require('../controllers/screeningController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, submitScreening)
  .get(protect, getScreenings);

module.exports = router;
