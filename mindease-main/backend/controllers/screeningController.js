const Screening = require('../models/Screening');

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

    const screening = await Screening.create({
      user: req.user.id,
      type,
      score,
      severity,
      answers
    });

    res.status(201).json({ success: true, data: screening });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get user screenings
// @route   GET /api/screening
// @access  Private
exports.getScreenings = async (req, res) => {
  try {
    const screenings = await Screening.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: screenings.length, data: screenings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
