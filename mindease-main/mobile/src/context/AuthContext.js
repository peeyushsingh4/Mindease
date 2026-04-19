import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../config/constants';

const AuthContext = createContext(null);

const extractUser = (res) => res?.data?.user || res?.data?.data || null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const saveSession = async (nextToken, nextRefreshToken, nextUser) => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    if (nextRefreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken);
    }
    setToken(nextToken);
    setUser(nextUser);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!storedToken) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setToken(storedToken);
        }

        const res = await api.get('/auth/me');
        if (!cancelled) {
          setUser(extractUser(res));
        }
      } catch (err) {
        if (!cancelled) {
          await clearSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password, age) => {
    const payload = { email, password };
    if (age !== undefined) {
      payload.age = age;
    }
    const res = await api.post('/auth/login', payload);
    const nextToken = res?.data?.token;
    const nextRefreshToken = res?.data?.refreshToken;
    if (!nextToken) {
      throw new Error('Auth token was not returned from login.');
    }
    await saveSession(nextToken, nextRefreshToken, extractUser(res));
    return extractUser(res);
  };

  const register = async ({ name, email, password, role = 'student', age }) => {
    const res = await api.post('/auth/register', { name, email, password, role, age });
    const nextToken = res?.data?.token;
    const nextRefreshToken = res?.data?.refreshToken;
    if (!nextToken) {
      throw new Error('Auth token was not returned from registration.');
    }
    await saveSession(nextToken, nextRefreshToken, extractUser(res));
    return extractUser(res);
  };

  const loginAnonymous = async (guardianData = {}) => {
    const res = await api.post('/auth/anonymous', guardianData);
    const nextToken = res?.data?.token;
    const nextRefreshToken = res?.data?.refreshToken;
    if (!nextToken) {
      throw new Error('Auth token was not returned from anonymous login.');
    }
    await saveSession(nextToken, nextRefreshToken, extractUser(res));
    return extractUser(res);
  };

  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const updateGuardian = async (guardianPayload) => {
    const res = await api.put('/auth/guardian', guardianPayload);
    const updatedUser = extractUser(res);
    if (updatedUser) {
      setUser(updatedUser);
    }
    return updatedUser;
  };

  const verifyGuardianWithFirebase = async (guardianPayload) => {
    const res = await api.post('/auth/guardian/verify-firebase', guardianPayload);
    const updatedUser = extractUser(res);
    if (updatedUser) {
      setUser(updatedUser);
    }
    return updatedUser;
  };

  const logout = async () => {
    await clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      loginAnonymous,
      updateGuardian,
      verifyGuardianWithFirebase,
      updateUser,
      logout,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
};
