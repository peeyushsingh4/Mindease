const Journal = require('../models/Journal');

// @desc    Add journal entry
// @route   POST /api/journal
// @access  Private
exports.addEntry = async (req, res) => {
  try {
    const { content, prompt } = req.body;

    const journal = await Journal.create({
      user: req.user.id,
      content,
      prompt
    });

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
    const entries = await Journal.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
