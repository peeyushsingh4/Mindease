const { getAuth, getDb } = require('../lib/firebase');

const normalizeUser = (uid, userDoc) => ({
  id: uid,
  _id: uid,
  name: userDoc.name || '',
  email: userDoc.email || '',
  role: userDoc.role || 'student',
  isAnonymous: Boolean(userDoc.isAnonymous),
  anonymousId: userDoc.anonymousId || '',
  guardianName: userDoc.guardianName || '',
  guardianPhone: userDoc.guardianPhone || '',
  guardianRelation: userDoc.guardianRelation || ''
});

const nowIso = () => new Date().toISOString();

const requireWebApiKey = () => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw new Error('FIREBASE_WEB_API_KEY is required for Firebase Auth sign-in flow');
  }
  return apiKey;
};

const signInWithPassword = async (email, password) => {
  const apiKey = requireWebApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message;
    if (message === 'INVALID_LOGIN_CREDENTIALS' || message === 'INVALID_PASSWORD' || message === 'EMAIL_NOT_FOUND') {
      return { ok: false, error: 'Invalid credentials' };
    }
    return { ok: false, error: 'Unable to login right now. Please try again.' };
  }
  return { ok: true, token: payload.idToken, refreshToken: payload.refreshToken, localId: payload.localId };
};

const signInWithCustomToken = async (customToken) => {
  const apiKey = requireWebApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Failed to create session from custom token');
  }
  return { token: payload.idToken, refreshToken: payload.refreshToken, localId: payload.localId };
};

const refreshIdToken = async (refreshToken) => {
  const apiKey = requireWebApiKey();
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
  });
  const payload = await response.json();
  if (!response.ok) {
    return { ok: false, error: 'Session refresh failed. Please login again.' };
  }
  return {
    ok: true,
    token: payload.id_token,
    refreshToken: payload.refresh_token,
    localId: payload.user_id
  };
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

    const authUser = await getAuth().createUser({
      email: normalizedEmail,
      password,
      displayName: name.trim()
    });

    const profile = {
      name: name.trim(),
      email: normalizedEmail,
      role: safeRole,
      isAnonymous: false,
      anonymousId: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: '',
      createdAt: nowIso()
    };
    await getDb().collection('users').doc(authUser.uid).set(profile);

    const signInResult = await signInWithPassword(normalizedEmail, password);
    if (!signInResult.ok) {
      return res.status(500).json({ success: false, error: 'Account created but login session failed. Please login.' });
    }

    return res.status(201).json({
      success: true,
      token: signInResult.token,
      refreshToken: signInResult.refreshToken,
      user: normalizeUser(authUser.uid, profile)
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
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
    const signInResult = await signInWithPassword(normalizedEmail, password);
    if (!signInResult.ok) {
      return res.status(401).json({ success: false, error: signInResult.error });
    }

    const userDoc = await getDb().collection('users').doc(signInResult.localId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    return res.status(200).json({
      success: true,
      token: signInResult.token,
      refreshToken: signInResult.refreshToken,
      user: normalizeUser(userDoc.id, userDoc.data())
    });
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
    const authUser = await getAuth().createUser({
      displayName: anonymousId
    });

    const profile = {
      isAnonymous: true,
      anonymousId,
      role: 'student',
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || '',
      guardianRelation: guardianRelation || '',
      name: '',
      email: '',
      createdAt: nowIso()
    };

    await getDb().collection('users').doc(authUser.uid).set(profile);
    const customToken = await getAuth().createCustomToken(authUser.uid);
    const signInResult = await signInWithCustomToken(customToken);

    res.status(201).json({
      success: true,
      token: signInResult.token,
      refreshToken: signInResult.refreshToken,
      user: normalizeUser(authUser.uid, profile)
    });
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
    const userRef = getDb().collection('users').doc(req.user.id);
    await userRef.set(
      {
        guardianName: (guardianName || '').trim(),
        guardianPhone: (guardianPhone || '').trim(),
        guardianRelation: (guardianRelation || '').trim()
      },
      { merge: true }
    );
    const userDoc = await userRef.get();
    res.status(200).json({ success: true, data: normalizeUser(userDoc.id, userDoc.data()), user: normalizeUser(userDoc.id, userDoc.data()) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const userDoc = await getDb().collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: normalizeUser(userDoc.id, userDoc.data()), user: normalizeUser(userDoc.id, userDoc.data()) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get all counsellors (for appointment booking dropdown)
// @route   GET /api/auth/counsellors
// @access  Private
exports.getCounsellors = async (req, res) => {
  try {
    const snapshot = await getDb().collection('users').where('role', '==', 'counsellor').get();
    const counsellors = snapshot.docs.map((doc) => ({
      _id: doc.id,
      id: doc.id,
      name: doc.data().name || '',
      email: doc.data().email || ''
    }));
    res.status(200).json({ success: true, count: counsellors.length, data: counsellors });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Refresh Firebase session token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }
    const result = await refreshIdToken(refreshToken);
    if (!result.ok) {
      return res.status(401).json({ success: false, error: result.error });
    }
    const userDoc = await getDb().collection('users').doc(result.localId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    return res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: normalizeUser(userDoc.id, userDoc.data())
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
