const { getDb } = require('../lib/firebase');
const { toGuardianPhoneE164 } = require('../utils/guardianPhone');
const { sendSms } = require('../utils/smsProvider');
const { scoreScreeningRisk } = require('../utils/riskScoring');

const nowIso = () => new Date().toISOString();

async function sendScreeningSmsToGuardian({ guardianPhone, type, score, severity }) {
  const phoneE164 = toGuardianPhoneE164(guardianPhone);
  if (!phoneE164) {
    return false;
  }

  const result = await sendSms({
    to: phoneE164,
    message: `MindEase Alert: A new ${type} screening was completed. Score: ${score}, Severity: ${severity}. Please check in with your emergency contact.`,
  });
  if (!result.sent) {
    console.error('[screening sms] SMS failed:', result.reason || 'unknown_error');
  }
  return result.sent;
}

const getSeverity = (type, score) => {
  if (type === 'PHQ-9') {
    if (score <= 4)  return 'Minimal';
    if (score <= 9)  return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe';
  }
  if (type === 'GAD-7') {
    if (score <= 4)  return 'Minimal';
    if (score <= 9)  return 'Mild';
    if (score <= 14) return 'Moderate';
    return 'Severe';
  }
  return 'Unknown';
};

// @desc    Submit screening
// @route   POST /api/screening
// @access  Private
exports.submitScreening = async (req, res) => {
  try {
    const { type, answers } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Screening type is required' });
    }

    // answers must be a non-empty array of numbers
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, error: 'answers array is required' });
    }

    const score = answers.reduce((acc, curr) => acc + Number(curr), 0);
    const severity = getSeverity(type, score);
    const risk = scoreScreeningRisk(type, score);

    const payload = {
      user: req.user.id,
      type,
      score,
      severity,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskModelVersion: risk.modelVersion,
      answers,
      createdAt: nowIso()
    };
    const docRef = await getDb().collection('screenings').add(payload);
    const screening = { _id: docRef.id, id: docRef.id, ...payload };

    const userDoc = await getDb().collection('users').doc(req.user.id).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.guardianPhoneVerified && userData?.guardianPhone) {
        await sendScreeningSmsToGuardian({
          guardianPhone: userData.guardianPhone,
          type,
          score,
          severity
        });
      }
    }

    res.status(201).json({ success: true, data: screening, risk });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get user screenings
// @route   GET /api/screening
// @access  Private
exports.getScreenings = async (req, res) => {
  try {
    const snapshot = await getDb().collection('screenings').where('user', '==', req.user.id).get();
    const screenings = snapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.status(200).json({ success: true, count: screenings.length, data: screenings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
