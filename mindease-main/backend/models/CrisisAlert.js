const mongoose = require('mongoose');

// BUG FIX: chatController detected crisis keywords but had a comment saying
// "// Typically, log this event here for admin review" — it never actually saved
// anything. Counsellors and admins had no way to see crisis events at all.
// This model enables crisis alerts to be stored and queried.
const CrisisAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CrisisAlert', CrisisAlertSchema);
