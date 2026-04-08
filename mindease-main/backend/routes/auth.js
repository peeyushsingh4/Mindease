const express = require('express');
const { register, login, anonymous, getMe, getCounsellors, updateGuardian } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/anonymous', anonymous);
router.get('/me', protect, getMe);
router.get('/counsellors', protect, getCounsellors);
router.put('/guardian', protect, updateGuardian);

module.exports = router;
