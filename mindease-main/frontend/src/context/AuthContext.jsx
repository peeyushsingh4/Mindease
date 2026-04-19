/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useRef } from 'react';
import api, { AUTH_UNAUTHORIZED_EVENT, REFRESH_STORAGE_KEY } from '../api';
export const AuthContext = createContext(null);

const getStoredToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (err) {
    console.error('Failed to read auth token from local storage:', err);
    return null;
  }
};

const persistToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('token', token);
      return;
    }
    localStorage.removeItem('token');
  } catch (err) {
    console.error('Failed to update auth token in local storage:', err);
  }
};

const persistRefreshToken = (refreshToken) => {
  try {
    if (refreshToken) {
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
      return;
    }
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to update refresh token in local storage:', err);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  // Track when token was just set by a login/register/anonymous action.
  // This prevents unnecessary duplicate /auth/me requests.
  const skipNextAuthCheck = useRef(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      persistToken(null);
      persistRefreshToken(null);
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (skipNextAuthCheck.current) {
        skipNextAuthCheck.current = false;
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const res = await api.get('/auth/me');
        if (!cancelled) {
          setUser(res.data?.data || res.data?.user || null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          persistToken(null);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applySession = (res) => {
    const nextToken = res.data?.token;
    const nextRefreshToken = res.data?.refreshToken;
    const nextUser = res.data?.user || res.data?.data || null;
    if (!nextToken) {
      throw new Error('Authentication token was not returned by the server.');
    }

    persistToken(nextToken);
    persistRefreshToken(nextRefreshToken || null);
    setToken(nextToken);
    setUser(nextUser);

    // If user is already in response, skip immediate /auth/me re-fetch.
    skipNextAuthCheck.current = Boolean(nextUser);
    setLoading(!nextUser);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    applySession(res);
  };

  const register = async (name, email, password, role, age) => {
    const res = await api.post('/auth/register', { name, email, password, role, age });
    applySession(res);
  };

  const loginAnonymous = async (guardianData = {}) => {
    const res = await api.post('/auth/anonymous', guardianData);
    applySession(res);
  };

  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const verifyGuardianWithFirebase = async (guardianPayload) => {
    const res = await api.post('/auth/guardian/verify-firebase', guardianPayload);
    const nextUser = res.data?.user || res.data?.data || null;
    if (nextUser) {
      setUser(nextUser);
    }
    return nextUser;
  };

  const logout = () => {
    persistToken(null);
    persistRefreshToken(null);
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginAnonymous, logout, updateUser, verifyGuardianWithFirebase }}>
      {children}
    </AuthContext.Provider>
  );
};
