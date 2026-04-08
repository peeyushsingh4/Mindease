const express = require('express');
const { addEntry, getEntries } = require('../controllers/journalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, addEntry)
  .get(protect, getEntries);

module.exports = router;
