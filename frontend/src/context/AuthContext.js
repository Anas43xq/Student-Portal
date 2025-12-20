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
    const checkSession = async () => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/auth/session`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.warn('Session check failed:', error);
        setUser(null);
        localStorage.removeItem("user");
      }
      setSessionChecked(true);
    };

    checkSession();
  }, []);

  const login = (userData) => {
    const cleanUser = { ...userData };
    delete cleanUser.password;

    setUser(cleanUser);
    localStorage.setItem("user", JSON.stringify(cleanUser));
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    }

    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, sessionChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
