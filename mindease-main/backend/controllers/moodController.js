const Mood = require('../models/Mood');

// @desc    Log mood
// @route   POST /api/mood
// @access  Private
exports.addMood = async (req, res) => {
  try {
    const { level, note } = req.body;

    const mood = await Mood.create({
      user: req.user.id,
      level,
      note
    });

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
    const moods = await Mood.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: moods.length,
      data: moods
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
