import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const decodeTokenRole = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return decoded?.role || null;
  } catch (error) {
    return null;
  }
};

const normalizeUser = (user) => {
  if (!user) return null;

  const id = user.id || user._id || user.userId || null;
  return {
    ...user,
    id,
    _id: user._id || id,
    userId: user.userId || id,
    image: user.image ?? null,
  };
};

const resolveRole = (role) => {
  const value = String(role || '').trim();
  const normalized = value.toLowerCase();

  if (['reader', 'user', 'normal user', 'normal-user', 'member'].includes(normalized)) {
    return 'Reader';
  }

  if (['author', 'admin', 'editor'].includes(normalized)) {
    return 'Author';
  }

  return 'Reader';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const storedUser = raw ? JSON.parse(raw) : null;
      const token = api.getAccessToken();
      const roleFromToken = decodeTokenRole(token);
      const normalizedUser = normalizeUser(storedUser);

      if (normalizedUser && !normalizedUser.role && roleFromToken) {
        return { ...normalizedUser, role: roleFromToken };
      }

      return normalizedUser;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const token = api.getAccessToken();
    if (token) {
      api.setAccessToken(token);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const accessToken = res.data.accessToken || res.data.token;
    const apiUser = res.data.user;
    const roleFromToken = decodeTokenRole(accessToken);
    const nextUser = normalizeUser({
      ...(apiUser || {}),
      role: apiUser?.role || roleFromToken || 'Reader',
    });

    if (accessToken) {
      api.setAccessToken(accessToken);
    }

    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    return res;
  };

  const register = async (name, email, password, role = 'Reader') => {
    const normalizedRole = resolveRole(role);
    const res = await api.post('/auth/register', { name, email, password, role: normalizedRole });
    return res;
  };

  const logout = () => {
    api.clearAccessToken();
    localStorage.removeItem('user');

    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

    setUser(null);
  };

  const updateUser = (nextUser) => {
    const mergedUser = normalizeUser({
      ...(user || {}),
      ...(nextUser || {}),
    });

    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
    return mergedUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
