import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, authAPI } from '../services/api';

const API_BASE_URL = 'https://student-portal-owa4.onrender.com';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      if (user) {
        try {
          const response = await apiFetch(`${API_BASE_URL}/api/auth/validate`);
          const data = await response.json();
          if (!response.ok || !data.valid) {
            // Token invalid, clear local storage
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem('token');
          }
        } catch (error) {
          // Backend not available or token invalid
          console.warn('Token validation failed:', error);
        }
      }
      setSessionChecked(true);
    };

    validateSession();
  }, [user]);

  const login = (userData) => {
    const cleanUser = { ...userData };
    delete cleanUser.password;

    setUser(cleanUser);
    localStorage.setItem("user", JSON.stringify(cleanUser));
  };

  const logout = async () => {
    // Best-effort notify server (JWT logout is client-side) and clear local data
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
