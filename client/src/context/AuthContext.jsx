import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/admin.js';

const AuthContext = createContext(null);
const ANON = { status: 'anon', user: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    adminApi
      .me()
      .then((user) => !cancelled && setState({ status: 'authed', user }))
      .catch(() => !cancelled && setState(ANON));
    return () => {
      cancelled = true;
    };
  }, []);

  // Any admin request that comes back 401 (expired session) logs the UI out
  useEffect(() => {
    const onUnauthorized = () => setState(ANON);
    window.addEventListener('admin:unauthorized', onUnauthorized);
    return () => window.removeEventListener('admin:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const user = await adminApi.login(email, password);
    setState({ status: 'authed', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setState(ANON);
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
