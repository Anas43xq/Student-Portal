import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/shared/LoginPage';
import DashboardPage from './pages/shared/DashboardPage';
import ProfilePage from './pages/shared/ProfilePage';
import InstructorsPage from './pages/shared/InstructorsPage';
import StudentsPage from './pages/admin/StudentsPage';
import StudentDetailsPage from './pages/admin/StudentDetailsPage';
import EnrollmentsPage from './pages/admin/EnrollmentsPage';
import AdminPage from './pages/admin/AdminPage';
import CoursesPage from './pages/student/CoursesPage';
import QuizzesPage from './pages/student/QuizzesPage';
import QuizResultsPage from './pages/instructor/QuizResultsPage';
import './styles/App.css';

const App = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false); 
    
    if (page !== 'students' && page !== 'student-details') {
      setSelectedStudentId(null);
    }
  };

  const handleViewStudentDetails = (studentId) => {
    setSelectedStudentId(studentId);
    setCurrentPage('student-details');
    setSidebarOpen(false);
  };

  const handleBackToStudents = () => {
    setSelectedStudentId(null);
    setCurrentPage('students');
  };

  const hasAccess = (page) => {
    if (page === 'admin') {
      return user?.role === 'Admin';
    }
    if (page === 'students' || page === 'student-details') {
      return user?.role === 'Admin';
    }
    return true;
  };

  const renderPage = () => {

    if (!hasAccess(currentPage)) {
      return (
        <div className="alert alert-danger m-4">
          <h3>Access Denied</h3>
          <p>You don't have permission to view this page.</p>
          <button 
            className="btn btn-primary mt-2" 
            onClick={() => handleNavigate('dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      
      case 'profile':
        return <ProfilePage />;
      
      case 'students':
        return <StudentsPage onViewDetails={handleViewStudentDetails} />;
      
      case 'student-details':
        if (!selectedStudentId) {
          handleNavigate('students');
          return null;
        }
        return (
          <StudentDetailsPage 
            studentId={selectedStudentId} 
            onBack={handleBackToStudents} 
          />
        );
      
      case 'courses':
        return <CoursesPage />;
      
      case 'enrollments':
        return <EnrollmentsPage />;
      
      case 'instructors':
        return <InstructorsPage />;
      
      case 'quizzes':
        return <QuizzesPage />;
      
      case 'quiz-results':
        return <QuizResultsPage />;
      
      case 'admin':
        return <AdminPage />;
      
      default:

        return (
          <div className="alert alert-warning m-4">
            <h3>Page Not Found</h3>
            <p>The page you're looking for doesn't exist.</p>
            <button 
              className="btn btn-primary mt-2" 
              onClick={() => handleNavigate('dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        );
    }
  };
  

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-layout">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
