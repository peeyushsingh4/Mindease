const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String, // 'Anonymous' or real name depending on preference
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  category: {
    type: String,
    enum: ['stress', 'sleep', 'relationships', 'mindfulness', 'general'],
    default: 'general'
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  reports: {
    type: Number,
    default: 0
  },
  comments: [{
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);
