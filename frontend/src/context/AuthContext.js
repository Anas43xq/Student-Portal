import React, { createContext, useContext, useState, useEffect } from "react";

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
          const response = await fetch('http://localhost:5000/api/auth/validate', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            // Session invalid, clear local storage
            setUser(null);
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Backend not available or session invalid
          console.warn('Session validation failed:', error);
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

  const logout = () => {
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
