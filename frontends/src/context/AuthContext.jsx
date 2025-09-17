// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'https://backend-9qig.onrender.com';
const STORAGE_AUTH = 'auth';
const STORAGE_REMEMBER = 'remember_me';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function readStoredAuth() {
  try {
    const raw =
      localStorage.getItem(STORAGE_AUTH) ||
      sessionStorage.getItem(STORAGE_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth, remember) {
  try {
    const payload = JSON.stringify(auth);
    if (remember) {
      localStorage.setItem(STORAGE_AUTH, payload);
      sessionStorage.removeItem(STORAGE_AUTH);
      localStorage.setItem(STORAGE_REMEMBER, '1');
    } else {
      sessionStorage.setItem(STORAGE_AUTH, payload);
      localStorage.removeItem(STORAGE_AUTH);
      localStorage.removeItem(STORAGE_REMEMBER);
    }
  } catch {}
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_AUTH);
  sessionStorage.removeItem(STORAGE_AUTH);
  localStorage.removeItem(STORAGE_REMEMBER);
}

export function AuthProvider({ children }) {
  const initial = readStoredAuth();
  const initialRef = useRef(initial);

  const [token, setToken] = useState(() => initial?.token || null);
  const [user, setUser] = useState(() => initial?.user || null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const doLogout = useCallback((updateLoading = true) => {
    clearStoredAuth();
    delete api.defaults.headers.common['Authorization'];
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setUser(null);
    setToken(null);
    if (updateLoading) setIsLoading(false);
  }, []);

  const scheduleAutoLogout = useCallback((jwt) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (!jwt) return;
    try {
      const decoded = jwtDecode(jwt);
      if (!decoded?.exp) return;
      const nowMs = Date.now();
      const expMs = decoded.exp * 1000;
      const delta = expMs - nowMs - 5000;
      if (delta > 0) {
        logoutTimerRef.current = setTimeout(() => {
          doLogout();
        }, delta);
      }
    } catch {}
  }, [doLogout]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users/profile');
      if (!data?.email) throw new Error('Profil non valide');
      setUser(data);
      return true;
    } catch (err) {
      console.error('❌ Erreur profil :', err?.response?.data || err?.message);
      return false;
    }
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401) doLogout();
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [doLogout]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const init = initialRef.current;
        if (init?.token) {
          const decoded = jwtDecode(init.token);
          const now = Date.now() / 1000;
          if (decoded?.exp && decoded.exp <= now) {
            if (!cancelled) doLogout(false);
          } else {
            if (!cancelled) {
              setToken(init.token);
              scheduleAutoLogout(init.token);
            }
            const ok = await fetchUserProfile();
            if (!ok && !cancelled) doLogout(false);
          }
        } else {
          const ok = await fetchUserProfile();
          if (!ok && !cancelled) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [doLogout, scheduleAutoLogout, fetchUserProfile]);

  const login = useCallback(
    async (newToken, userData = null, options = {}) => {
      const remember =
        typeof options.remember === 'boolean'
          ? options.remember
          : !!localStorage.getItem(STORAGE_REMEMBER);

      setIsLoading(true);
      setToken(newToken || null);
      scheduleAutoLogout(newToken || null);
      writeStoredAuth({ token: newToken || null, user: userData || null }, remember);

      if (userData) {
        setUser(userData);
      } else {
        const ok = await fetchUserProfile();
        if (!ok) {
          doLogout();
          return;
        }
      }

      setIsLoading(false);
    },
    [fetchUserProfile, scheduleAutoLogout, doLogout]
  );

  const logout = useCallback(() => doLogout(true), [doLogout]);
  const isAdmin = user?.isAdmin === true || user?.role === 'admin';

  const value = useMemo(
    () => ({ user, token, isAdmin, isLoading, login, logout }),
    [user, token, isAdmin, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
