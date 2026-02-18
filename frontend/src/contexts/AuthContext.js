import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('auth-changed', handleAuthChange);
    
    // Refresh user data on mount to get latest KYC status
    if (authService.getCurrentUser()) {
        authService.refreshUser();
    }

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      // setUser is handled by event listener, but we can also set it here for immediate feedback if needed.
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    // setUser is naturally handled by the event listener
  };

  const signup = async (username, email, password, role) => {
    setLoading(true);
    try {
      return await authService.signup(username, email, password, role);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signup
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
