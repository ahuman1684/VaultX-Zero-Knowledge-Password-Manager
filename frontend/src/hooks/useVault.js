import { useState, useCallback } from 'react';
import api from '../api/client';
import { encryptPassword, decryptPassword } from '../crypto';

export function useVault(vaultKey) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/vault');
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load vault');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = useCallback(async ({ site, username, plainPassword }) => {
    const encryptedPassword = await encryptPassword(vaultKey, plainPassword);
    const { data } = await api.post('/vault', { site, username, encryptedPassword });
    setEntries((prev) => [...prev, data].sort((a, b) => a.site.localeCompare(b.site)));
    return data;
  }, [vaultKey]);

  const updateEntry = useCallback(async (id, { site, username, plainPassword }) => {
    const encryptedPassword = await encryptPassword(vaultKey, plainPassword);
    const { data } = await api.put(`/vault/${id}`, { site, username, encryptedPassword });
    setEntries((prev) => prev.map((e) => (e.id === id ? data : e)));
    return data;
  }, [vaultKey]);

  const deleteEntry = useCallback(async (id) => {
    await api.delete(`/vault/${id}`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const revealPassword = useCallback(async (encryptedPassword) => {
    return decryptPassword(vaultKey, encryptedPassword);
  }, [vaultKey]);

  return { entries, loading, error, fetchEntries, addEntry, updateEntry, deleteEntry, revealPassword };
}
