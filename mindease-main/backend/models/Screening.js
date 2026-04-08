const mongoose = require('mongoose');

const ScreeningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['PHQ-9', 'GAD-7'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  severity: {
    type: String, // Minimal, Mild, Moderate, Moderately Severe, Severe
    required: true
  },
  answers: [{
    type: Number,
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Screening', ScreeningSchema);
