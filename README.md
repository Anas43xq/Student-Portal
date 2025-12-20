# 🎓 Student Portal

A comprehensive web application for managing student enrollment, courses, quizzes, and academic records. Built with React frontend and Node.js backend.

## 🌟 Features

### 👨‍🎓 Student Features
- **Course Enrollment**: Browse and enroll in available courses
- **Academic Records**: View grades, GPA, and completed courses
- **Quiz Participation**: Take quizzes and view results
- **Profile Management**: Update personal information

### 👨‍🏫 Instructor Features
- **Course Management**: Create and manage courses
- **Quiz Creation**: Design and grade quizzes
- **Student Oversight**: Monitor enrolled students
- **Grade Management**: Assign and update student grades

### 👨‍💼 Admin Features
- **User Management**: Create, edit, and manage all users
- **System Oversight**: View system statistics and activities
- **Enrollment Control**: Manage course enrollments
- **Security**: User banning/unbanning capabilities

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern JavaScript library
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **CSS3** - Custom styling with dark mode support

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **JWT** - Token-based authentication

### DevOps
- **GitHub Actions** - CI/CD automation
- **GitHub Pages** - Frontend deployment
- **Render** - Backend deployment

## 📁 Project Structure

```
student-portal/
├── frontend/               # React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── styles/        # CSS stylesheets
│   └── package.json
├── backend/               # Node.js server
│   ├── server.js         # Main server file
│   ├── package.json
│   └── schema.sql        # Database schema
├── scripts/              # Utility scripts
└── .github/workflows/    # GitHub Actions
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anas43xq/Student-Portal.git
   cd Student-Portal
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

   Configure database connection in `Configurations.env`:
   ```env
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   DB_PORT=3306
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   # Import the schema
   mysql -u your_user -p your_database < ../backend/schema.sql
   ```

### Running the Application

1. **Start Backend** (from backend directory)
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start Frontend** (from frontend directory)
   ```bash
   npm start
   # Frontend runs on http://localhost:3000
   ```

3. **Build for Production**
   ```bash
   # Frontend build
   cd frontend
   npm run build

   # Backend is ready for deployment
   ```

## 🔐 Authentication

The application uses a simplified authentication system:

### Default Users
- **Admin**: `admin` / `admin123`
- **Student**: `student` / `student123`
- **Instructor**: `instructor` / `instructor123`

### User Roles
1. **Admin**: Full system access
2. **Instructor**: Course and quiz management
3. **Student**: Enrollment and quiz participation

## 📡 API Documentation

### Authentication Endpoints
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /api/auth/session` - Check session status

### Student Endpoints
- `GET /api/courses` - Get available courses
- `POST /api/enrollments` - Enroll in course
- `GET /api/students/:id` - Get student profile

### Admin Endpoints
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `POST /api/students` - Create student

### Instructor Endpoints
- `GET /api/instructor/stats` - Instructor dashboard
- `POST /api/quizzes` - Create quiz
- `GET /api/instructor/quiz-results` - View quiz results

## 🚀 Deployment

### Frontend (GitHub Pages)
The frontend is automatically deployed to GitHub Pages on every push to the `main` branch.

**Live URL**: https://anas43xq.github.io/Student-Portal

### Backend (Render)
The backend is deployed on Render and accessible at:
**API URL**: https://student-portal-owa4.onrender.com

## 🔧 Configuration

### Environment Variables
Create `backend/Configurations.env`:
```env
NODE_ENV=production
CORS_ORIGIN=https://anas43xq.github.io
SESSION_SECRET=your-secret-key
# Database
DB_HOST=sql5.freesqldatabase.com
DB_USER=sql5812469
DB_PASSWORD=QB5vzAA7Qr
DB_NAME=sql5812469
DB_PORT=3306

# Other settings
MAX_CREDITS_PER_SEMESTER=18
BCRYPT_SALT_ROUNDS=10
```

### Running with the hosted (online) frontend
If your frontend is hosted on a different origin (e.g., GitHub Pages), ensure cross-origin session cookies work by following these steps:

1. **Set `CORS_ORIGIN`** to the exact origin of your hosted frontend (e.g., `https://anas43xq.github.io`).
2. **Use HTTPS for both frontend and backend** — secure cookies are required when using `SameSite=None`.
3. **Set `NODE_ENV=production`** in `Configurations.env` so the server will use secure cookies and `SameSite=None` for cross-site sessions.
4. **If behind a proxy (Render)**, set `TRUST_PROXY=1` so secure cookies are handled correctly.
5. **Verify cookies are sent**: open DevTools → Network, select an API request, and confirm the `Cookie` header is present and the response includes `Access-Control-Allow-Credentials: true` and `Access-Control-Allow-Origin` matches your frontend origin.

If you still see "Failed to load dashboard data", check the backend logs for messages like `GET /api/admin/stats - origin: ...` (added to help debug cross-origin requests).
## 📊 Database Schema

The application uses MySQL with the following main tables:
- `Users` - User accounts and authentication
- `Students` - Student-specific information
- `Courses` - Course catalog
- `Enrollments` - Student-course relationships
- `Instructors` - Instructor information
- `Quizzes` - Quiz definitions
- `QuizSubmissions` - Student quiz attempts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Anas** - [GitHub](https://github.com/Anas43xq)

## 🙏 Acknowledgments

- Built with React and Node.js
- Icons from Lucide React
- Deployed on GitHub Pages and Render
