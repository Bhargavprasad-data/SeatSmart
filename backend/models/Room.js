const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  building: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  benchesPerRow: {
    type: Number,
    default: 2
  },
  totalRows: {
    type: Number
  },
  layout: {
    type: String,
    enum: ['normal', 'exam-hall'],
    default: 'normal'
  },
  facilities: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);

