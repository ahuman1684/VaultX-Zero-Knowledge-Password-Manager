import { useState, useEffect } from 'react';
import { decryptPassword } from '../crypto';
import StrengthMeter from './StrengthMeter';
import PasswordGenerator from './PasswordGenerator';

export default function AddPasswordModal({ entry, vaultKey, onSave, onClose }) {
  const isEdit = !!entry;
  const [form, setForm] = useState({ site: '', username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (entry) {
      decryptPassword(vaultKey, entry.encrypted_password)
        .then((plain) => setForm({ site: entry.site, username: entry.username, password: plain }))
        .catch(() => setError('Failed to decrypt — wrong vault key?'));
    }
  }, [entry, vaultKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.site.trim() || !form.username.trim() || !form.password) {
      setError('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: entry?.id,
        site: form.site.trim(),
        username: form.username.trim(),
        plainPassword: form.password,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleUseGeneratedPassword = (password) => {
    setForm((prev) => ({ ...prev, password }));
    setShowGenerator(false);
    setShowPassword(true);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 modal-backdrop bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">
            {isEdit ? 'Edit Entry' : 'Add New Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Site / App Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. GitHub"
              value={form.site}
              onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Username / Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. user@example.com"
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              autoComplete="off"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <button
                type="button"
                onClick={() => setShowGenerator((v) => !v)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showGenerator ? 'Hide generator' : '⚡ Generate'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field font-mono pr-10"
                placeholder="Enter or generate a password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <StrengthMeter password={form.password} />
          </div>

          {showGenerator && (
            <div className="bg-navy-900 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Password Generator</p>
              <PasswordGenerator onUse={handleUseGeneratedPassword} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
