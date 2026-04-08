const User = require('../models/User');
const jwt = require('jsonwebtoken');
const normalizeUser = (userDoc) => ({
  id: userDoc._id,
  _id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  isAnonymous: userDoc.isAnonymous,
  anonymousId: userDoc.anonymousId,
  guardianName: userDoc.guardianName,
  guardianPhone: userDoc.guardianPhone,
  guardianRelation: userDoc.guardianRelation
});

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: normalizeUser(user)
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // BUG FIX (defence-in-depth): Even though the frontend no longer shows the 'admin'
    // role option, reject it server-side too. Never trust the client to enforce rules.
    const allowedRoles = ['student', 'counsellor'];
    const safeRole = allowedRoles.includes(role) ? role : 'student';
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role: safeRole });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create anonymous user (guardian details collected upfront)
// @route   POST /api/auth/anonymous
// @access  Public
exports.anonymous = async (req, res) => {
  try {
    const { guardianName, guardianPhone, guardianRelation } = req.body;
    const anonymousId = `anon_${Math.random().toString(36).slice(2, 11)}`;
    const user = await User.create({
      isAnonymous: true,
      anonymousId,
      role: 'student',
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || '',
      guardianRelation: guardianRelation || ''
    });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update guardian details for any user (called after registration too)
// @route   PUT /api/auth/guardian
// @access  Private
exports.updateGuardian = async (req, res) => {
  try {
    const { guardianName, guardianPhone, guardianRelation } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        guardianName: (guardianName || '').trim(),
        guardianPhone: (guardianPhone || '').trim(),
        guardianRelation: (guardianRelation || '').trim()
      },
      { returnDocument: 'after', runValidators: false }
    );
    res.status(200).json({ success: true, data: normalizeUser(user), user: normalizeUser(user) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: normalizeUser(user), user: normalizeUser(user) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all counsellors (for appointment booking dropdown)
// @route   GET /api/auth/counsellors
// @access  Private
exports.getCounsellors = async (req, res) => {
  try {
    const counsellors = await User.find({ role: 'counsellor' }).select('name email');
    res.status(200).json({ success: true, count: counsellors.length, data: counsellors });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
