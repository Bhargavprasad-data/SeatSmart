const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth middleware
router.use(auth);

// @route   GET /api/exams
// @desc    Get all exams
// @access  Private
router.get('/', async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const { status, branch, year, search } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (branch) query.branch = branch;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { subjectCode: { $regex: search, $options: 'i' } }
      ];
    }

    const exams = await Exam.find(query)
      .sort({ date: 1, startTime: 1 });

    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/exams/:id
// @desc    Get single exam
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/exams
// @desc    Add exam
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const { subject, subjectCode, date, startTime, endTime, branch, year, semester } = req.body;

    const exam = new Exam({
      subject,
      subjectCode,
      date,
      startTime,
      endTime,
      branch,
      year,
      semester
    });

    await exam.save();
    res.status(201).json({ message: 'Exam added successfully', exam });
  } catch (error) {
    console.error('Add exam error:', error);
    res.status(500).json({ message: 'Server error adding exam' });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ message: 'Exam updated successfully', exam: updatedExam });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const Exam = require('../models/Exam');
    const SeatingPlan = require('../models/SeatingPlan');
    
    // Check if exam has seating plans
    const seatingPlans = await SeatingPlan.find({ examId: req.params.id });
    if (seatingPlans.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete exam. It has associated seating plans.' 
      });
    }

    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

