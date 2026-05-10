import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import { deriveKey } from '../crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { username }
  const [vaultKey, setVaultKey] = useState(null); // CryptoKey — never in storage
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from refresh token
  useEffect(() => {
    const refresh = localStorage.getItem('vaultx_refresh');
    if (refresh) {
      api.post('/auth/refresh', { refreshToken: refresh })
        .then(({ data }) => {
          window.__vaultAccessToken = data.accessToken;
          // We have a valid session but no vaultKey — user must re-enter master password
          // For now just mark as needing re-auth (vault key is never stored)
          setUser({ username: null, needsKeyRestore: true });
        })
        .catch(() => {
          localStorage.removeItem('vaultx_refresh');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Clear in-memory tokens when tab closes
    const handleUnload = () => {
      window.__vaultAccessToken = null;
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const login = useCallback(async (username, masterPassword) => {
    const { data } = await api.post('/auth/login', { username, masterPassword });
    window.__vaultAccessToken = data.accessToken;
    localStorage.setItem('vaultx_refresh', data.refreshToken);

    const key = await deriveKey(masterPassword, username);
    setVaultKey(key);
    setUser({ username });
  }, []);

  const register = useCallback(async (username, masterPassword) => {
    await api.post('/auth/register', { username, masterPassword });
  }, []);

  const logout = useCallback(() => {
    window.__vaultAccessToken = null;
    setVaultKey(null);
    setUser(null);
    localStorage.removeItem('vaultx_refresh');
  }, []);

  return (
    <AuthContext.Provider value={{ user, vaultKey, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
