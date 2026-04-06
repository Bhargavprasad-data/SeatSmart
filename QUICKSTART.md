# 🚀 Quick Start Guide

This guide will help you get SeatSmart up and running in minutes.

## Step 1: Install Dependencies

Open a terminal in the project root and run:

```bash
npm run install-all
```

This will install all dependencies for both backend and frontend.

## Step 2: Configure MongoDB

### Option A: Local MongoDB

1. Install MongoDB on your machine
2. Start MongoDB service
3. The default connection string is already set: `mongodb://localhost:27017/seatsmart`

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `backend/.env` with your MongoDB URI

## Step 3: Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will now be running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Step 4: First Login

1. Open your browser to http://localhost:3000
2. Click "Register" to create an admin account
3. Fill in:
   - Full Name: Your Name
   - Email: admin@college.edu
   - Password: (at least 6 characters)

## Step 5: Add Data

### Add Students

1. Go to "Students" in the sidebar
2. Click "Add Student" and manually enter students
   OR
3. Click "Upload CSV/Excel"
4. Use the provided `example-students.csv` or create your own

### Add Rooms

1. Go to "Rooms" in the sidebar
2. Click "Add Room"
3. Fill in:
   - Room Number: e.g., "101"
   - Building: e.g., "Main Building"
   - Capacity: e.g., "50"
   - Benches per Row: e.g., "2"
   - Layout: "normal"

### Add Exams

1. Go to "Exams" in the sidebar
2. Click "Add Exam"
3. Fill in exam details:
   - Subject: e.g., "Data Structures"
   - Subject Code: e.g., "CS301"
   - Date: Select date
   - Start Time: e.g., "09:00"
   - End Time: e.g., "12:00"
   - Branch: e.g., "Computer Science"
   - Year: e.g., "3"

### Add Faculty

1. Go to "Faculty" in the sidebar
2. Click "Add Faculty"
3. Fill in faculty details

### Generate Seating Plan

1. Go to "Seating Plans" in the sidebar
2. Click "Generate Plan"
3. Select an exam from the dropdown
4. Optionally enable "Cross-branch mixing"
5. Click "Generate Plan"
6. Download the plan as PDF or Excel

## Testing Student Login

1. Go back to the login page
2. Enter a student's roll number (from the students you added)
3. View their exam schedule and seating arrangement

## Tips

- The system automatically allocates seats based on roll number
- Faculty conflicts are automatically detected
- You can download seating plans in PDF or Excel format
- Use bulk upload to add many students at once

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running (local) or connection string is correct (Atlas)
- Check firewall settings

### Port Already in Use
- Change PORT in backend/.env
- For frontend, it will prompt you to use a different port

### CORS Errors
- Make sure backend is running on port 5000
- Check axios baseURL in AuthContext.js

## Need Help?

Check the main [README.md](README.md) for detailed documentation.

