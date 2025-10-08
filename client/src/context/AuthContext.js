import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api'; // Make sure api service is imported

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sidebarStats, setSidebarStats] = useState(null); // <-- NEW STATE

  // NEW function to fetch stats
  const fetchSidebarStats = useCallback(async () => {
    if (user && user.role === 'admin') {
      try {
        const res = await api.get('/reports/sidebar-stats');
        setSidebarStats(res.data);
      } catch (err) {
        console.error("Failed to fetch sidebar stats", err);
      }
    }
  }, [user]); // Dependency on 'user'

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decodedToken.user);
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  // NEW useEffect to fetch stats when user logs in
  useEffect(() => {
    fetchSidebarStats();
  }, [fetchSidebarStats]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setSidebarStats(null); // Clear stats on logout
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, sidebarStats, fetchSidebarStats }}>
      {children}
    </AuthContext.Provider>
  );
};