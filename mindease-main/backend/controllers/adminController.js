const { getDb } = require('../lib/firebase');

const getCount = async (collectionName) => {
  const snapshot = await getDb().collection(collectionName).get();
  return snapshot.size;
};

const userSummary = async (userId) => {
  if (!userId) return null;
  const userDoc = await getDb().collection('users').doc(userId).get();
  if (!userDoc.exists) return null;
  const data = userDoc.data();
  return {
    _id: userDoc.id,
    id: userDoc.id,
    name: data.name || '',
    email: data.email || '',
    isAnonymous: Boolean(data.isAnonymous),
    anonymousId: data.anonymousId || ''
  };
};

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getMetrics = async (req, res) => {
  try {
    const [totalUsers, totalAppointments, totalScreenings, totalPosts, totalCrisisAlerts] = await Promise.all([
      getCount('users'),
      getCount('appointments'),
      getCount('screenings'),
      getCount('posts'),
      getCount('crisisAlerts')
    ]);

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
    const screeningSnapshot = await getDb().collection('screenings').get();
    const severeScreeningsRaw = screeningSnapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .filter((item) => ['Severe', 'Moderately Severe'].includes(item.severity))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 20);

    const severeScreenings = await Promise.all(
      severeScreeningsRaw.map(async (item) => ({
        ...item,
        user: await userSummary(item.user)
      }))
    );

    // BUG FIX 2: Crisis chat events were never exposed to admins at all because
    // chatController was not saving them. Now that they're persisted we surface them here.
    const crisisSnapshot = await getDb().collection('crisisAlerts').get();
    const crisisAlertsRaw = crisisSnapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 20);

    const crisisAlerts = await Promise.all(
      crisisAlertsRaw.map(async (item) => ({
        ...item,
        user: await userSummary(item.user)
      }))
    );

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
