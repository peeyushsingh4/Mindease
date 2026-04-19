const express = require('express');
const {
  register,
  login,
  anonymous,
  refresh,
  getMe,
  getCounsellors,
  updateGuardian,
  verifyGuardianWithFirebase,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/anonymous', anonymous);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.get('/counsellors', protect, getCounsellors);
router.put('/guardian', protect, updateGuardian);
router.post('/guardian/verify-firebase', protect, verifyGuardianWithFirebase);

module.exports = router;
