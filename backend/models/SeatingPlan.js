const mongoose = require('mongoose');

const seatingPlanSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  facultyIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  }],
  seatingArrangement: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    rollNumber: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    seatNumber: {
      type: String,
      required: true
    },
    row: {
      type: Number
    },
    bench: {
      type: Number
    }
  }],
  totalSeats: {
    type: Number,
    default: 0
  },
  occupiedSeats: {
    type: Number,
    default: 0
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SeatingPlan', seatingPlanSchema);

