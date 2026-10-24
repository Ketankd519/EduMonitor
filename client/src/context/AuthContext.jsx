import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const getStoredToken = () => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('edumonitor_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('edumonitor_token') ||
      null
    );
  };

  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const res = await API.post('/auth/login', { email, password });
    const authToken = res.data.token;
    const authUser = res.data.user;

    if (rememberMe) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('edumonitor_token', authToken);
      if (authUser) {
        localStorage.setItem('edumonitor_user', JSON.stringify(authUser));
      }
      localStorage.setItem('edumonitor_remember', 'true');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('edumonitor_token');
      sessionStorage.removeItem('edumonitor_user');
    } else {
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('edumonitor_token', authToken);
      if (authUser) {
        sessionStorage.setItem('edumonitor_user', JSON.stringify(authUser));
      }
      sessionStorage.removeItem('edumonitor_remember');
      localStorage.removeItem('token');
      localStorage.removeItem('edumonitor_token');
      localStorage.removeItem('edumonitor_user');
      localStorage.removeItem('edumonitor_remember');
    }

    setToken(authToken);
    setUser(authUser);
    return res.data;
  };

  const register = async (formData) => {
    const res = await API.post('/auth/register', formData);
    const authToken = res.data.token;
    const authUser = res.data.user;

    localStorage.setItem('token', authToken);
    localStorage.setItem('edumonitor_token', authToken);
    if (authUser) {
      localStorage.setItem('edumonitor_user', JSON.stringify(authUser));
    }

    setToken(authToken);
    setUser(authUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('edumonitor_token');
    localStorage.removeItem('edumonitor_user');
    localStorage.removeItem('edumonitor_remember');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('edumonitor_token');
    sessionStorage.removeItem('edumonitor_user');
    setToken(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, register, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};