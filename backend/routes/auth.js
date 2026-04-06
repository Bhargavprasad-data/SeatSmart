const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register admin
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, pin } = req.body;

    // Validate PIN
    const correctPin = process.env.ADMIN_PIN || '089488';
    if (pin !== correctPin) {
      return res.status(401).json({ message: 'Invalid PIN. Registration not allowed.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'admin'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login admin or student
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, rollNumber } = req.body;

    // Student login with roll number
    if (rollNumber) {
      const Student = require('../models/Student');
      const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
      
      if (!student) {
        return res.status(401).json({ message: 'Invalid roll number' });
      }

      const token = generateToken(student._id, 'student');

      return res.json({
        message: 'Student login successful',
        token,
        user: {
          id: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
          branch: student.branch,
          year: student.year,
          role: 'student'
        }
      });
    }

    // Admin login
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findById(req.user.userId);
      return res.json({ user: student, role: 'student' });
    }

    const user = await User.findById(req.user.userId).select('-password');
    res.json({ user, role: req.user.role });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

