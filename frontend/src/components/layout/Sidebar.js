import React from 'react';
import { Home, Users, BookOpen, Calendar, UserCheck, X, User, GraduationCap, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['Student', 'Admin', 'Instructor'] },
    { id: 'profile', label: 'My Profile', icon: User, roles: ['Student', 'Admin', 'Instructor'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['Admin'] },
    { id: 'courses', label: 'Courses', icon: BookOpen, roles: ['Student', 'Admin', 'Instructor'] },
    { id: 'instructors', label: 'Instructors', icon: GraduationCap, roles: ['Student', 'Admin'] },
    { id: 'quizzes', label: 'Quizzes', icon: FileText, roles: ['Student', 'Admin', 'Instructor'] },
    { id: 'quiz-results', label: 'Quiz Results', icon: CheckCircle, roles: ['Instructor', 'Admin'] },
    { id: 'enrollments', label: 'Enrollments', icon: Calendar, roles: ['Admin', 'Instructor'] },
    { id: 'admin', label: 'Admin Panel', icon: UserCheck, roles: ['Admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {isOpen && <div className="sidebar-overlay d-lg-none" onClick={onClose}></div>}
      <aside className={`sidebar bg-light border-end ${isOpen ? 'show' : ''}`}>
        <nav>
          <div className="d-flex justify-content-between align-items-center p-3 d-lg-none border-bottom">
            <h2 className="h5 mb-0">Menu</h2>
            <button className="btn btn-link text-dark p-0" onClick={onClose} aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <ul className="list-group list-group-flush">
            {filteredItems.map(item => (
              <li key={item.id} className="list-group-item p-0 border-0">
                <button
                  className={`list-group-item list-group-item-action border-0 w-100 text-start ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                >
                  <item.icon size={18} className="me-2" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
