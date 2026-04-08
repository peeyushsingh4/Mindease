const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const { counsellorId, date, timeSlot, notes } = req.body;

    // Verify counsellor exists
    const counsellor = await User.findOne({ _id: counsellorId, role: 'counsellor' });
    if (!counsellor) {
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

    const conflict = await Appointment.findOne({
      counsellor: counsellorId,
      timeSlot,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'approved'] }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please choose a different slot.'
      });
    }

    const appointment = await Appointment.create({
      student: req.user.id,
      counsellor: counsellorId,
      date,
      timeSlot,
      notes
    });

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
    let query;

    if (req.user.role === 'counsellor') {
      query = { counsellor: req.user.id };
    } else if (req.user.role === 'admin') {
      query = {}; // admin sees all
    } else {
      query = { student: req.user.id };
    }

    const appointments = await Appointment.find(query)
      .populate({ path: 'counsellor', select: 'name email role' })
      .populate({ path: 'student', select: 'name email role' })
      .sort('date');

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
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (appointment.counsellor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, meetingLink: req.body.meetingLink },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
