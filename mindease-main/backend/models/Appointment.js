const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  counsellor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String, // e.g., "10:00 AM - 11:00 AM"
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'cancelled'],
    default: 'pending'
  },
  meetingLink: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
