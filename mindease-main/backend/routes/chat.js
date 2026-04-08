const express = require('express');
const { chatRespond, getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/respond', protect, chatRespond);
router.get('/history', protect, getChatHistory); // user fetches their own history on load

module.exports = router;
