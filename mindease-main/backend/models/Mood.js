const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number, // 1: Terrible, 2: Bad, 3: Okay, 4: Good, 5: Awesome
    required: true,
    min: 1,
    max: 5
  },
  note: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mood', MoodSchema);
