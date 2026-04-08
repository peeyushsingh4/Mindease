const mongoose = require('mongoose');

// Persists every chat turn so counsellors can review conversation history
// and so the chatbot can reload context across sessions.
const ChatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isCrisis: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast per-user history retrieval
ChatMessageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
