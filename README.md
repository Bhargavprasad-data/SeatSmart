# 🏫 SeatSmart - Engineering College Exam Seating Arrangement Planner

A comprehensive MERN stack application for managing exam seating arrangements in engineering colleges.

## 🚀 Features

### 👩‍🏫 Admin Side
- **Authentication**: Secure login/signup with JWT
- **Student Management**: 
  - Manual student entry
  - Bulk upload via CSV/Excel with Multer
- **Room Management**: Add rooms with capacity and layout details
- **Exam Management**: Create and manage exams with subject, date, time, branch, and year
- **Faculty Management**: Add and manage faculty members with department details
- **Invigilator Assignment**: 
  - Assign faculty to rooms as invigilators
  - Auto-detect time conflicts and prevent double-booking
- **Seating Plan Generation**:
  - Dynamic seat allocation based on roll number
  - Cross-branch mixing option for better spacing
  - Auto-fill rooms respecting capacity and layout
- **Export Options**:
  - Download as PDF (via pdfkit)
  - Download as Excel (via exceljs)

### 🎓 Student Side (Optional)
- Login using Roll Number
- View exam details: Subject, date, time
- View seating info: Assigned room and seat number

## 🛠️ Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Export**: pdfkit & exceljs

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SeatSmart
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/seatsmart
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   NODE_ENV=development
   ```

5. **Create uploads directory**
   ```bash
   cd backend
   mkdir uploads
   ```

6. **Start the application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 📖 Usage

### Admin Login
1. Navigate to `http://localhost:3000`
2. Register a new admin account or login with existing credentials
3. Fill in the required details

### Adding Students
- **Manual Entry**: Go to Students page → Click "Add Student" → Fill the form
- **Bulk Upload**: Click "Upload CSV/Excel" → Select file with columns: Roll Number, Name, Branch, Year, Semester (optional), Email (optional), Phone (optional)

### Creating Exams
1. Go to Exams page
2. Click "Add Exam"
3. Fill in subject, date, time, branch, year details
4. Save

### Generating Seating Plans
1. Go to Seating Plans page
2. Click "Generate Plan"
3. Select an exam
4. Optionally enable cross-branch mixing
5. Click "Generate Plan"
6. Download as PDF or Excel

### Student Login
- Use roll number to login at the login page
- View assigned exams and seating arrangements

## 🧩 Key Features

### Dynamic Seat Allocation
- Automatically allocates seats based on roll number order
- Respects room capacity and layout constraints

### Cross-Branch Mixing
- Option to mix students from different branches for spacing
- Helps in preventing cheating during exams

### Faculty Conflict Detection
- Automatically detects if a faculty member is already assigned to another room at overlapping times
- Prevents double-booking of invigilators

### Room Capacity Validation
- Ensures total seating capacity meets student requirements
- Alerts if insufficient rooms for all students

## 📁 Project Structure

```
SeatSmart/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # File uploads directory
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/       # Page components
│   │   └── App.js       # Main app component
│   └── public/          # Public assets
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization

## 🚧 Future Enhancements

- [ ] Multi-language support
- [ ] Mobile app version
- [ ] SMS/Email notifications
- [ ] Advanced reporting and analytics
- [ ] Role-based access control
- [ ] Real-time updates

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

Built with ❤️ for educational institutions

