const express = require('express');
const { addMood, getMoodHistory } = require('../controllers/moodController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, addMood)
  .get(protect, getMoodHistory);

module.exports = router;
