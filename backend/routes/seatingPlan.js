const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Import models at the top to ensure they're registered before use
const SeatingPlan = require('../models/SeatingPlan');
const Exam = require('../models/Exam');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

// Apply auth middleware
router.use(auth);

// @route   GET /api/seating-plan
// @desc    Get all seating plans
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { examId, roomId } = req.query;
    
    let query = {};
    if (examId) query.examId = examId;
    if (roomId) query.roomId = roomId;

    const plans = await SeatingPlan.find(query)
      .populate('examId')
      .populate('roomId')
      .populate('facultyIds');

    res.json(plans);
  } catch (error) {
    console.error('Get seating plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/seating-plan/:id
// @desc    Get single seating plan
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const plan = await SeatingPlan.findById(req.params.id)
      .populate('examId')
      .populate('roomId')
      .populate('facultyIds')
      .populate('seatingArrangement.studentId');

    if (!plan) {
      return res.status(404).json({ message: 'Seating plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Get seating plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/seating-plan/generate
// @desc    Generate seating plan for an exam
// @access  Private (Admin only)
router.post('/generate', isAdmin, async (req, res) => {
  try {
    const { examId, crossBranchMixing = false, facultyIds } = req.body;

    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check for faculty conflicts
    if (facultyIds && facultyIds.length > 0) {
      const conflicts = await checkFacultyConflicts(facultyIds, exam.date, exam.startTime, exam.endTime, examId);
      if (conflicts.length > 0) {
        return res.status(400).json({
          message: 'Faculty assignment conflicts detected',
          conflicts
        });
      }
    }

    // Get eligible students
    const studentQuery = { branch: exam.branch, year: exam.year };
    if (crossBranchMixing) {
      delete studentQuery.branch; // Allow all branches if cross mixing
    }
    const students = await Student.find(studentQuery).sort({ rollNumber: 1 });

    if (students.length === 0) {
      return res.status(400).json({ message: 'No students found for this exam' });
    }

    // Get available rooms
    const rooms = await Room.find({ isActive: true }).sort({ capacity: -1 });

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'No active rooms available' });
    }

    // Generate seating arrangements
    const seatingPlans = [];
    let remainingStudents = [...students];

    for (const room of rooms) {
      if (remainingStudents.length === 0) break;

      const studentsToAssign = remainingStudents.splice(0, room.capacity);
      const seatingArrangement = assignSeats(studentsToAssign, room);

      const plan = new SeatingPlan({
        examId: exam._id,
        roomId: room._id,
        facultyIds: facultyIds || [],
        seatingArrangement,
        totalSeats: room.capacity,
        occupiedSeats: studentsToAssign.length,
        isGenerated: true
      });

      await plan.save();
      seatingPlans.push(plan);

      // Update exam total students
      exam.totalStudents = (exam.totalStudents || 0) + studentsToAssign.length;
    }

    await exam.save();

    if (remainingStudents.length > 0) {
      return res.status(400).json({
        message: `Insufficient room capacity. ${remainingStudents.length} students could not be assigned.`,
        seatingPlans,
        unassignedStudents: remainingStudents.length
      });
    }

    res.status(201).json({
      message: 'Seating plan generated successfully',
      seatingPlans: await Promise.all(
        seatingPlans.map(p => p.populate('examId roomId facultyIds'))
      )
    });
  } catch (error) {
    console.error('Generate seating plan error:', error);
    res.status(500).json({ message: 'Server error generating seating plan' });
  }
});

// Helper function to assign seats
function assignSeats(students, room) {
  const arrangement = [];
  let seatNumber = 1;

  for (const student of students) {
    const row = Math.ceil(seatNumber / (room.benchesPerRow || 2));
    const bench = ((seatNumber - 1) % (room.benchesPerRow || 2)) + 1;
    
    arrangement.push({
      studentId: student._id,
      rollNumber: student.rollNumber,
      studentName: student.name,
      seatNumber: `R${row}B${bench}`,
      row,
      bench
    });

    seatNumber++;
  }

  return arrangement;
}

// Helper function to check faculty conflicts
async function checkFacultyConflicts(facultyIds, date, startTime, endTime, currentExamId) {
  const conflicts = [];
  
  // Find exams on the same date
  const examsOnSameDate = await Exam.find({
    date,
    _id: { $ne: currentExamId },
    status: 'scheduled'
  });

  for (const exam of examsOnSameDate) {
    // Check time overlap
    if (timeOverlaps(startTime, endTime, exam.startTime, exam.endTime)) {
      const plans = await SeatingPlan.find({ examId: exam._id }).populate('facultyIds');
      const assignedFaculty = new Set();
      
      plans.forEach(plan => {
        plan.facultyIds.forEach(faculty => assignedFaculty.add(faculty._id.toString()));
      });

      for (const facultyId of facultyIds) {
        if (assignedFaculty.has(facultyId.toString())) {
          // Get faculty details for better error messages
          const faculty = await Faculty.findById(facultyId);
          conflicts.push({
            facultyId,
            facultyName: faculty ? faculty.name : 'Unknown',
            facultyFacultyId: faculty ? faculty.facultyId : 'Unknown',
            conflictingExamId: exam._id,
            conflictingExam: exam.subject,
            conflictingExamCode: exam.subjectCode || '',
            date,
            time: `${exam.startTime} - ${exam.endTime}`
          });
        }
      }
    }
  }

  return conflicts;
}

// Helper function to check time overlap
function timeOverlaps(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// @route   PUT /api/seating-plan/:id
// @desc    Update seating plan (assign faculty, modify seating)
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { facultyIds, seatingArrangement } = req.body;
    const plan = await SeatingPlan.findById(req.params.id).populate('examId');
    
    if (!plan) {
      return res.status(404).json({ message: 'Seating plan not found' });
    }

    // Check faculty conflicts if updating faculty
    if (facultyIds) {
      const exam = await Exam.findById(plan.examId._id);
      const conflicts = await checkFacultyConflicts(
        facultyIds, 
        exam.date, 
        exam.startTime, 
        exam.endTime, 
        exam._id.toString()
      );
      
      if (conflicts.length > 0) {
        return res.status(400).json({
          message: 'Faculty assignment conflicts detected',
          conflicts
        });
      }
      
      plan.facultyIds = facultyIds;
    }

    if (seatingArrangement) {
      plan.seatingArrangement = seatingArrangement;
    }

    await plan.save();
    res.json({ message: 'Seating plan updated successfully', plan });
  } catch (error) {
    console.error('Update seating plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/seating-plan/:id
// @desc    Delete seating plan
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const plan = await SeatingPlan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Seating plan not found' });
    }

    // Update exam total students
    const exam = await Exam.findById(plan.examId);
    if (exam) {
      exam.totalStudents = Math.max(0, (exam.totalStudents || 0) - plan.occupiedSeats);
      await exam.save();
    }

    res.json({ message: 'Seating plan deleted successfully' });
  } catch (error) {
    console.error('Delete seating plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/seating-plan/:id/download/pdf
// @desc    Download seating plan as PDF
// @access  Private
router.get('/:id/download/pdf', async (req, res) => {
  try {
    const plan = await SeatingPlan.findById(req.params.id)
      .populate('examId')
      .populate('roomId')
      .populate('facultyIds');

    if (!plan) {
      return res.status(404).json({ message: 'Seating plan not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="seating-plan-${plan.roomId.roomNumber}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Seating Arrangement Plan', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Exam: ${plan.examId.subject} (${plan.examId.subjectCode})`, { align: 'center' });
    doc.text(`Date: ${plan.examId.date.toLocaleDateString()}`, { align: 'center' });
    doc.text(`Time: ${plan.examId.startTime} - ${plan.examId.endTime}`, { align: 'center' });
    doc.text(`Room: ${plan.roomId.roomNumber}`, { align: 'center' });
    doc.moveDown();

    // Faculty
    if (plan.facultyIds.length > 0) {
      doc.fontSize(14).text('Faculty Members:');
      doc.fontSize(10);
      plan.facultyIds.forEach(faculty => {
        doc.text(`${faculty.name} (${faculty.department})`);
      });
      doc.moveDown();
    }

    // Seating arrangement
    doc.fontSize(14).text('Seating Arrangement:');
    doc.fontSize(10);
    
    const tableTop = 200;
    const itemHeight = 20;
    let yPosition = tableTop;

    plan.seatingArrangement.forEach((item, index) => {
      if (index === 0 || index % 25 === 0) {
        // Create table header if needed
        doc.fontSize(8);
        doc.text('Roll No', 50, yPosition);
        doc.text('Student Name', 100, yPosition);
        doc.text('Seat', 300, yPosition);
        yPosition += itemHeight;
      }

      doc.text(item.rollNumber, 50, yPosition);
      doc.text(item.studentName, 100, yPosition);
      doc.text(item.seatNumber, 300, yPosition);

      if (yPosition > 750) {
        doc.addPage();
        yPosition = tableTop;
      } else {
        yPosition += itemHeight;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
});

// @route   GET /api/seating-plan/:id/download/excel
// @desc    Download seating plan as Excel
// @access  Private
router.get('/:id/download/excel', async (req, res) => {
  try {
    const plan = await SeatingPlan.findById(req.params.id)
      .populate('examId')
      .populate('roomId')
      .populate('facultyIds');

    if (!plan) {
      return res.status(404).json({ message: 'Seating plan not found' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Seating Plan');

    // Header
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Seating Arrangement Plan';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = 'Exam:';
    worksheet.getCell('B2').value = `${plan.examId.subject} (${plan.examId.subjectCode})`;

    worksheet.getCell('A3').value = 'Date:';
    worksheet.getCell('B3').value = plan.examId.date.toLocaleDateString();

    worksheet.getCell('A4').value = 'Time:';
    worksheet.getCell('B4').value = `${plan.examId.startTime} - ${plan.examId.endTime}`;

    worksheet.getCell('A5').value = 'Room:';
    worksheet.getCell('B5').value = plan.roomId.roomNumber;

    // Faculty
    if (plan.facultyIds.length > 0) {
      worksheet.getCell('A7').value = 'Faculty Members:';
      worksheet.getCell('A7').font = { bold: true };
      plan.facultyIds.forEach((faculty, idx) => {
        worksheet.getCell(`A${8 + idx}`).value = `${faculty.name} (${faculty.department})`;
      });
    }

    // Seating arrangement table
    let startRow = 8 + plan.facultyIds.length + 2;
    worksheet.getRow(startRow).values = ['Roll Number', 'Student Name', 'Seat Number', 'Branch'];
    worksheet.getRow(startRow).font = { bold: true };

    plan.seatingArrangement.forEach((item, idx) => {
      const row = worksheet.getRow(startRow + 1 + idx);
      row.values = [
        item.rollNumber,
        item.studentName,
        item.seatNumber,
        item.branch || ''
      ];
    });

    // Set column widths
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="seating-plan-${plan.roomId.roomNumber}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download Excel error:', error);
    res.status(500).json({ message: 'Server error generating Excel' });
  }
});

module.exports = router;

