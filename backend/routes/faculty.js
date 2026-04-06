const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth middleware
router.use(auth);

// @route   GET /api/faculty
// @desc    Get all faculty
// @access  Private
router.get('/', async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const { department, isActive, search } = req.query;
    
    let query = {};
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(query).sort({ name: 1 });
    res.json(faculty);
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/faculty/:id
// @desc    Get single faculty
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/faculty
// @desc    Add faculty
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const { facultyId, name, department, email, phone, designation } = req.body;

    const existingFaculty = await Faculty.findOne({ facultyId });
    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this ID already exists' });
    }

    const faculty = new Faculty({
      facultyId: facultyId.toUpperCase(),
      name,
      department,
      email,
      phone,
      designation
    });

    await faculty.save();
    res.status(201).json({ message: 'Faculty added successfully', faculty });
  } catch (error) {
    console.error('Add faculty error:', error);
    res.status(500).json({ message: 'Server error adding faculty' });
  }
});

// @route   PUT /api/faculty/:id
// @desc    Update faculty
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedFaculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({ message: 'Faculty updated successfully', faculty: updatedFaculty });
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/faculty/:id
// @desc    Delete faculty
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const Faculty = require('../models/Faculty');
    const SeatingPlan = require('../models/SeatingPlan');
    
    // Check if faculty is assigned to any seating plan
    const seatingPlans = await SeatingPlan.find({ facultyIds: req.params.id });
    if (seatingPlans.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete faculty. They are assigned to seating plans.' 
      });
    }

    const faculty = await Faculty.findByIdAndDelete(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

