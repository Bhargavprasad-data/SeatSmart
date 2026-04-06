const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const { auth, isAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/students
// @desc    Get all students (with optional filters)
// @access  Private (Admin) / Students can view their own details
router.get('/', async (req, res) => {
  try {
    const Student = require('../models/Student');
    const { branch, year, search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.userId);
      return res.json([student]);
    }

    if (branch) query.branch = branch;
    if (year) query.year = parseInt(year);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .sort({ rollNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Add single student
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const { rollNumber, name, branch, year, semester, email, phone } = req.body;

    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    const student = new Student({
      rollNumber: rollNumber.toUpperCase(),
      name,
      branch,
      year,
      semester,
      email,
      phone
    });

    await student.save();
    res.status(201).json({ message: 'Student added successfully', student });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Server error adding student' });
  }
});

// @route   POST /api/students/upload
// @desc    Upload students from CSV/Excel
// @access  Private (Admin only)
router.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  try {
    const Student = require('../models/Student');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const students = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const student = {
          rollNumber: row['Roll Number'] || row['rollNumber'] || row['ROLL NUMBER'],
          name: row['Name'] || row['name'] || row['NAME'],
          branch: row['Branch'] || row['branch'] || row['BRANCH'],
          year: parseInt(row['Year'] || row['year'] || row['YEAR']),
          semester: row['Semester'] || row['semester'] || row['SEMESTER'] ? parseInt(row['Semester'] || row['semester'] || row['SEMESTER']) : undefined,
          email: row['Email'] || row['email'] || row['EMAIL'],
          phone: row['Phone'] || row['phone'] || row['PHONE']
        };

        if (!student.rollNumber || !student.name || !student.branch || !student.year) {
          errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        student.rollNumber = student.rollNumber.toUpperCase();

        const existingStudent = await Student.findOne({ rollNumber: student.rollNumber });
        if (!existingStudent) {
          await Student.create(student);
          students.push(student);
        }
      } catch (error) {
        errors.push({ row: i + 2, error: error.message });
      }
    }

    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      message: 'File processed successfully',
      added: students.length,
      totalRows: data.length,
      errors
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error processing file' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

