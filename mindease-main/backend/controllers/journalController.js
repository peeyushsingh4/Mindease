const { getDb } = require('../lib/firebase');

const nowIso = () => new Date().toISOString();

// @desc    Add journal entry
// @route   POST /api/journal
// @access  Private
exports.addEntry = async (req, res) => {
  try {
    const { content, prompt } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Journal content is required' });
    }

    const payload = {
      user: req.user.id,
      content: content.trim(),
      createdAt: nowIso()
    };
    if (typeof prompt === 'string' && prompt.trim()) {
      payload.prompt = prompt.trim();
    }
    const docRef = await getDb().collection('journals').add(payload);
    const journal = { _id: docRef.id, id: docRef.id, ...payload };

    res.status(201).json({
      success: true,
      data: journal
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get journal entries
// @route   GET /api/journal
// @access  Private
exports.getEntries = async (req, res) => {
  try {
    const snapshot = await getDb().collection('journals').where('user', '==', req.user.id).get();
    const entries = snapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
