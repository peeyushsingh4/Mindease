const { getAuth, getDb } = require('../lib/firebase');
const { normalizeGuardianPhone, toGuardianPhoneE164 } = require('../utils/guardianPhone');

const normalizeUser = (uid, userDoc) => ({
  id: uid,
  _id: uid,
  name: userDoc.name || '',
  email: userDoc.email || '',
  age: Number.isFinite(Number(userDoc.age)) ? Number(userDoc.age) : null,
  role: userDoc.role || 'student',
  isAnonymous: Boolean(userDoc.isAnonymous),
  anonymousId: userDoc.anonymousId || '',
  guardianName: userDoc.guardianName || '',
  guardianPhone: userDoc.guardianPhone || '',
  guardianRelation: userDoc.guardianRelation || '',
  guardianPhoneVerified: Boolean(userDoc.guardianPhoneVerified)
});

const nowIso = () => new Date().toISOString();
/** Users must be 16 or older. */
const MINIMUM_AGE = 16;
const UNDERAGE_MESSAGE = 'MindEase is available for users aged 16 and above.';
const LOGIN_AGE_REQUIRED_MESSAGE = 'Please enter your age to finish signing in.';
const GUARDIAN_PHONE_MESSAGE = 'Emergency contact number must be exactly 10 digits with numbers only.';

const usersCollection = () => getDb().collection('users');

const buildGuardianFields = ({ guardianName, guardianPhone, guardianRelation }, { verified = false } = {}) => {
  const normalizedPhone = normalizeGuardianPhone(guardianPhone);
  return {
    guardianName: (guardianName || '').trim(),
    guardianPhone: normalizedPhone,
    guardianPhoneE164: normalizedPhone ? toGuardianPhoneE164(normalizedPhone) : '',
    guardianRelation: (guardianRelation || '').trim(),
    guardianPhoneVerified: Boolean(verified && normalizedPhone),
    guardianPhoneVerifiedAt: verified && normalizedPhone ? nowIso() : null,
  };
};

const toComparableIndianPhone = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return '';
};

const parseAge = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
};

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
    const { name, email, password, role, age } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const parsedAge = parseAge(age);

    if (!name?.trim() || !normalizedEmail || !password || parsedAge === null) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and age are required' });
    }
    if (parsedAge < MINIMUM_AGE) {
      return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
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
      age: parsedAge,
      role: safeRole,
      isAnonymous: false,
      anonymousId: '',
      guardianName: '',
      guardianPhone: '',
      guardianPhoneE164: '',
      guardianRelation: '',
      guardianPhoneVerified: false,
      guardianPhoneVerifiedAt: null,
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
    const { email, password, age } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const providedAge = parseAge(age);

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
    const userData = userDoc.data();
    let parsedAge = parseAge(userData.age);

    if (parsedAge === null) {
      if (providedAge === null) {
        return res.status(400).json({ success: false, error: LOGIN_AGE_REQUIRED_MESSAGE });
      }
      if (providedAge < MINIMUM_AGE) {
        return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
      }

      parsedAge = providedAge;
      userData.age = parsedAge;
      await getDb().collection('users').doc(signInResult.localId).set({ age: parsedAge }, { merge: true });
    }

    if (parsedAge === null || parsedAge < MINIMUM_AGE) {
      return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
    }

    return res.status(200).json({
      success: true,
      token: signInResult.token,
      refreshToken: signInResult.refreshToken,
      user: normalizeUser(userDoc.id, userData)
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
    const { guardianName, guardianPhone, guardianRelation, age } = req.body;
    const parsedAge = parseAge(age);
    if (parsedAge === null) {
      return res.status(400).json({ success: false, error: 'Age is required for authentication.' });
    }
    if (parsedAge < MINIMUM_AGE) {
      return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
    }
    const anonymousId = `anon_${Math.random().toString(36).slice(2, 11)}`;
    const authUser = await getAuth().createUser({
      displayName: anonymousId
    });

    const profile = {
      isAnonymous: true,
      anonymousId,
      role: 'student',
      age: parsedAge,
      ...buildGuardianFields({ guardianName, guardianPhone, guardianRelation }, { verified: false }),
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
    const normalizedPhone = normalizeGuardianPhone(guardianPhone);
    if (!guardianName?.trim() || !normalizedPhone) {
      return res.status(400).json({ success: false, error: GUARDIAN_PHONE_MESSAGE });
    }
    const userRef = usersCollection().doc(req.user.id);
    const existingUser = await userRef.get();
    const existingData = existingUser.exists ? existingUser.data() : {};
    // One-time verification policy: once verified, do not force re-verification.
    const keepVerified = Boolean(existingData.guardianPhoneVerified) || normalizeGuardianPhone(existingData.guardianPhone) === normalizedPhone;

    await userRef.set(
      buildGuardianFields({ guardianName, guardianPhone: normalizedPhone, guardianRelation }, { verified: keepVerified }),
      { merge: true }
    );
    const userDoc = await userRef.get();
    res.status(200).json({ success: true, data: normalizeUser(userDoc.id, userDoc.data()), user: normalizeUser(userDoc.id, userDoc.data()) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Verify guardian phone through Firebase Phone Auth proof
// @route   POST /api/auth/guardian/verify-firebase
// @access  Private
exports.verifyGuardianWithFirebase = async (req, res) => {
  try {
    const { guardianName, guardianPhone, guardianRelation, firebaseIdToken } = req.body;
    const normalizedPhone = normalizeGuardianPhone(guardianPhone);
    if (!guardianName?.trim() || !normalizedPhone) {
      return res.status(400).json({ success: false, error: GUARDIAN_PHONE_MESSAGE });
    }
    if (!firebaseIdToken) {
      return res.status(400).json({ success: false, error: 'Firebase verification token is required.' });
    }

    const decoded = await getAuth().verifyIdToken(firebaseIdToken);
    const firebasePhone = toComparableIndianPhone(decoded?.phone_number || '');
    if (!firebasePhone || firebasePhone !== normalizedPhone) {
      return res.status(400).json({ success: false, error: 'Verified phone does not match emergency contact number.' });
    }

    const userRef = usersCollection().doc(req.user.id);
    await userRef.set(
      {
        ...buildGuardianFields(
          { guardianName, guardianPhone: normalizedPhone, guardianRelation },
          { verified: true }
        ),
        guardianOtpCode: null,
        guardianOtpExpiresAt: null,
        guardianOtpRequestedAt: null,
        guardianOtpAttempts: 0,
      },
      { merge: true }
    );

    const updatedDoc = await userRef.get();
    return res.status(200).json({
      success: true,
      data: normalizeUser(updatedDoc.id, updatedDoc.data()),
      user: normalizeUser(updatedDoc.id, updatedDoc.data()),
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message || 'Firebase phone verification failed.' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const userDoc = await usersCollection().doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const userData = userDoc.data();
    const parsedAge = parseAge(userData.age);
    if (parsedAge === null || parsedAge < MINIMUM_AGE) {
      return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
    }
    res.status(200).json({ success: true, data: normalizeUser(userDoc.id, userData), user: normalizeUser(userDoc.id, userData) });
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
    const userDoc = await usersCollection().doc(result.localId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    const userData = userDoc.data();
    const parsedAge = parseAge(userData.age);
    if (parsedAge === null || parsedAge < MINIMUM_AGE) {
      return res.status(403).json({ success: false, error: UNDERAGE_MESSAGE });
    }
    return res.status(200).json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: normalizeUser(userDoc.id, userData)
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};
