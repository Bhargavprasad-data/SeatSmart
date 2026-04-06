const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);
router.use(isAdmin);

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Room = require('../models/Room');
    const Exam = require('../models/Exam');
    const Faculty = require('../models/Faculty');
    const SeatingPlan = require('../models/SeatingPlan');

    const stats = {
      totalStudents: await Student.countDocuments(),
      totalRooms: await Room.countDocuments(),
      activeRooms: await Room.countDocuments({ isActive: true }),
      upcomingExams: await Exam.countDocuments({ status: 'scheduled' }),
      totalFaculty: await Faculty.countDocuments(),
      generatedPlans: await SeatingPlan.countDocuments({ isGenerated: true })
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// @route   GET /api/admin/students/count
// @desc    Get student count by branch and year
// @access  Private (Admin only)
router.get('/students/count', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const branchStats = await Student.aggregate([
      {
        $group: {
          _id: { branch: '$branch', year: '$year' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.branch': 1, '_id.year': 1 } }
    ]);

    res.json(branchStats);
  } catch (error) {
    console.error('Branch count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

