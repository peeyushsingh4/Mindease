const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Screening = require('../models/Screening');
const Post = require('../models/Post');
const CrisisAlert = require('../models/CrisisAlert');

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalScreenings = await Screening.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCrisisAlerts = await CrisisAlert.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAppointments,
        totalScreenings,
        totalPosts,
        totalCrisisAlerts
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get alerts (severe screenings + crisis chat events)
// @route   GET /api/admin/alerts
// @access  Private (Admin, Counsellor)
exports.getAlerts = async (req, res) => {
  try {
    // BUG FIX 1: Original only fetched severity === 'Severe', missing 'Moderately Severe'
    // (PHQ-9 score 15–19). Students in that range also need counsellor attention.
    const severeScreenings = await Screening.find({
      severity: { $in: ['Severe', 'Moderately Severe'] }
    })
      .populate('user', 'name email isAnonymous anonymousId')
      .sort('-createdAt')
      .limit(20);

    // BUG FIX 2: Crisis chat events were never exposed to admins at all because
    // chatController was not saving them. Now that they're persisted we surface them here.
    const crisisAlerts = await CrisisAlert.find()
      .populate('user', 'name email isAnonymous anonymousId')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        screeningAlerts: {
          count: severeScreenings.length,
          items: severeScreenings
        },
        crisisAlerts: {
          count: crisisAlerts.length,
          items: crisisAlerts
        }
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
