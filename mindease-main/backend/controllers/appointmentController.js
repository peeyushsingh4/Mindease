const { getDb } = require('../lib/firebase');

const nowIso = () => new Date().toISOString();
const appointmentsCollection = () => getDb().collection('appointments');
const usersCollection = () => getDb().collection('users');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const { counsellorId, date, timeSlot, notes } = req.body;

    // Verify counsellor exists
    const counsellorDoc = await usersCollection().doc(counsellorId).get();
    if (!counsellorDoc.exists || counsellorDoc.data().role !== 'counsellor') {
      return res.status(404).json({ success: false, error: 'Counsellor not found' });
    }

    // BUG FIX: No double-booking check existed. The same counsellor + date + timeSlot
    // could be booked by unlimited students simultaneously, causing scheduling conflicts.
    // Now we reject the booking if that slot is already taken (pending or approved).
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await appointmentsCollection().where('counsellor', '==', counsellorId).get();
    const conflict = snapshot.docs
      .map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }))
      .find((item) => {
        const itemDate = new Date(item.date);
        return (
          item.timeSlot === timeSlot &&
          itemDate >= startOfDay &&
          itemDate <= endOfDay &&
          ['pending', 'approved'].includes(item.status)
        );
      });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please choose a different slot.'
      });
    }

    const payload = {
      student: req.user.id,
      counsellor: counsellorId,
      date,
      timeSlot,
      notes,
      status: 'pending',
      meetingLink: '',
      createdAt: nowIso()
    };
    const docRef = await appointmentsCollection().add(payload);
    const appointment = { _id: docRef.id, id: docRef.id, ...payload };

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get user appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    const snapshot = await appointmentsCollection().get();
    const rawAppointments = snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    const scoped = rawAppointments.filter((item) => {
      if (req.user.role === 'admin') return true;
      if (req.user.role === 'counsellor') return item.counsellor === req.user.id;
      return item.student === req.user.id;
    });

    const userIds = [...new Set(scoped.flatMap((item) => [item.student, item.counsellor]).filter(Boolean))];
    const userDocs = await Promise.all(userIds.map((id) => usersCollection().doc(id).get()));
    const usersMap = {};
    userDocs.forEach((doc) => {
      if (doc.exists) {
        usersMap[doc.id] = { _id: doc.id, id: doc.id, name: doc.data().name || '', email: doc.data().email || '', role: doc.data().role || 'student' };
      }
    });

    const appointments = scoped
      .map((item) => ({
        ...item,
        student: usersMap[item.student] || item.student,
        counsellor: usersMap[item.counsellor] || item.counsellor
      }))
      .sort((a, b) => (new Date(a.date) > new Date(b.date) ? 1 : -1));

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Counsellor, Admin)
exports.updateStatus = async (req, res) => {
  try {
    const appointmentRef = appointmentsCollection().doc(req.params.id);
    const appointmentDoc = await appointmentRef.get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    const appointment = appointmentDoc.data();

    if (appointment.counsellor !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await appointmentRef.update({
      status: req.body.status,
      meetingLink: req.body.meetingLink || ''
    });
    const updatedDoc = await appointmentRef.get();
    const updated = { _id: updatedDoc.id, id: updatedDoc.id, ...updatedDoc.data() };

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
