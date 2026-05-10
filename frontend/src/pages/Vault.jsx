import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVault } from '../hooks/useVault';
import PasswordCard from '../components/PasswordCard';
import AddPasswordModal from '../components/AddPasswordModal';

function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="skeleton h-9 w-full rounded-lg" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-6 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export default function Vault() {
  const { user, vaultKey, logout } = useAuth();
  const { addToast } = useToast();
  const { entries, loading, error, fetchEntries, addEntry, updateEntry, deleteEntry, revealPassword } = useVault(vaultKey);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) => e.site.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const handleSave = async ({ id, site, username, plainPassword }) => {
    if (id) {
      await updateEntry(id, { site, username, plainPassword });
      addToast('Entry updated', 'success');
    } else {
      await addEntry({ site, username, plainPassword });
      addToast('Entry added', 'success');
    }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditEntry(null);
  };

  const handleLogout = () => {
    logout();
    addToast('Signed out', 'info');
  };

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-navy-800/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-bold text-slate-100">VaultX</span>
          </div>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by site or username…"
                className="w-full bg-navy-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditEntry(null); setModalOpen(true); }}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats bar */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-slate-500">
              {search
                ? `Showing ${filtered.length} of ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
                : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} stored`}
            </div>
            {entries.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                AES-256 encrypted
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchEntries} className="btn-secondary text-sm">Retry</button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty states */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-navy-700 rounded-2xl mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">Your vault is empty</h2>
            <p className="text-slate-500 text-sm mb-6">Add your first password to get started.</p>
            <button
              onClick={() => { setEditEntry(null); setModalOpen(true); }}
              className="btn-primary"
            >
              Add your first password
            </button>
          </div>
        )}

        {!loading && !error && entries.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-2">No entries match your search</p>
            <button onClick={() => setSearch('')} className="text-indigo-400 text-sm hover:text-indigo-300">
              Clear search
            </button>
          </div>
        )}

        {/* Entries grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                vaultKey={vaultKey}
                onEdit={handleEdit}
                onDelete={deleteEntry}
                revealPassword={revealPassword}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <AddPasswordModal
          entry={editEntry}
          vaultKey={vaultKey}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
