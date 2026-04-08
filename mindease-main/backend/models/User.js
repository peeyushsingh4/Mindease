const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return !this.isAnonymous; }
  },
  email: {
    type: String,
    required: function() { return !this.isAnonymous; },
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: function() { return !this.isAnonymous; },
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'counsellor', 'admin'],
    default: 'student'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  anonymousId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Guardian / emergency contact — collected even for anonymous sessions
  guardianName: {
    type: String,
    default: ''
  },
  guardianPhone: {
    type: String,
    default: ''
  },
  guardianRelation: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
