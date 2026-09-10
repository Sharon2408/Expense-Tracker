import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { setAccessToken, setUnauthorizedHandler, setRefreshHandler } from '../api/httpClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    setRefreshHandler(async () => {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      return accessToken;
    });
  }, [clearSession]);

  // On first load, try to silently restore the session from the httpOnly
  // refresh cookie so a browser refresh does not log the user out.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const { user: me } = await authApi.me();
        setUser(me);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [clearSession]);

  const login = async (email, password) => {
    const { user: loggedInUser, accessToken } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    setUser(loggedInUser);
  };

  const signup = async (name, email, password) => {
    const { user: newUser, accessToken } = await authApi.signup({ name, email, password });
    setAccessToken(accessToken);
    setUser(newUser);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    clearSession();
  };

  const updateUser = (updated) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
