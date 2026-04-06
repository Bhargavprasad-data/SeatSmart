const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

// Apply auth middleware
router.use(auth);

// @route   GET /api/rooms
// @desc    Get all rooms
// @access  Private
router.get('/', async (req, res) => {
  try {
    const Room = require('../models/Room');
    const { isActive, building } = req.query;
    
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (building) query.building = building;

    const rooms = await Room.find(query).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const Room = require('../models/Room');
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms
// @desc    Add room
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const Room = require('../models/Room');
    const { roomNumber, building, capacity, benchesPerRow, totalRows, layout, facilities, isActive } = req.body;

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room with this number already exists' });
    }

    const room = new Room({
      roomNumber,
      building,
      capacity,
      benchesPerRow: benchesPerRow || 2,
      totalRows,
      layout: layout || 'normal',
      facilities,
      isActive: isActive !== undefined ? isActive : true
    });

    await room.save();
    res.status(201).json({ message: 'Room added successfully', room });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({ message: 'Server error adding room' });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const Room = require('../models/Room');
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const Room = require('../models/Room');
    const SeatingPlan = require('../models/SeatingPlan');
    
    // Check if room is used in any seating plan
    const seatingPlans = await SeatingPlan.find({ roomId: req.params.id });
    if (seatingPlans.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room. It is being used in seating plans.' 
      });
    }

    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

