import React from 'react';
import { Menu, LogOut, GraduationCap, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
        <div className="container-fluid">
          <button 
            className="btn btn-link text-white d-lg-none p-0 me-2" 
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="navbar-brand mb-0 h1">
            <GraduationCap className="me-2" size={28} style={{ marginTop: '-4px' }} />
            Student Portal
          </h1>
          <div className="ms-auto d-flex align-items-center">
            <span className="text-white me-3 d-none d-md-inline">
              {user?.firstName} {user?.lastName} ({user?.role})
            </span>
            <button 
              className="theme-toggle me-2" 
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              <LogOut size={16} className="me-1" />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
