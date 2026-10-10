import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = api.getAccessToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          api.setCurrentUser(profile);
        } catch (err) {
          console.warn('Failed to fetch profile with cached token:', err);
          api.clearTokens();
          setUser(null);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    setUser(data.user);
    return data.user;
  };

  const demoLogin = async (role) => {
    const data = await api.demoLogin(role);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  const canEdit = user?.role !== 'VIEWER';
  const isAdmin = user?.role === 'ADMIN';
  const isPM = user?.role === 'PROJECT_MANAGER';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        hasRole,
        canEdit,
        isAdmin,
        isPM,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
