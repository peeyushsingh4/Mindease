const { getDb } = require('../lib/firebase');

const nowIso = () => new Date().toISOString();

// @desc    Log mood
// @route   POST /api/mood
// @access  Private
exports.addMood = async (req, res) => {
  try {
    const { level, note } = req.body;

    const payload = {
      user: req.user.id,
      level,
      note,
      createdAt: nowIso()
    };
    const docRef = await getDb().collection('moods').add(payload);
    const mood = { _id: docRef.id, id: docRef.id, ...payload };

    res.status(201).json({
      success: true,
      data: mood
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get mood history
// @route   GET /api/mood
// @access  Private
exports.getMoodHistory = async (req, res) => {
  try {
    const snapshot = await getDb().collection('moods').where('user', '==', req.user.id).get();
    const moods = snapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    res.status(200).json({
      success: true,
      count: moods.length,
      data: moods
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
