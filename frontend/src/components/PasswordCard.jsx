import { useState, useEffect, useRef } from 'react';
import { copyToClipboard } from '../crypto';
import BreachChecker from './BreachChecker';
import { useToast } from '../context/ToastContext';

const REVEAL_DURATION = 10; // seconds
const COPY_CLEAR_DURATION = 30;

export default function PasswordCard({ entry, vaultKey, onEdit, onDelete, revealPassword }) {
  const { addToast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [plainPassword, setPlainPassword] = useState(null);
  const [revealCountdown, setRevealCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyCountdown, setCopyCountdown] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const revealTimerRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(revealTimerRef.current);
      clearInterval(copyTimerRef.current);
    };
  }, []);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setPlainPassword(null);
      clearInterval(revealTimerRef.current);
      setRevealCountdown(0);
      return;
    }

    try {
      const plain = await revealPassword(entry.encrypted_password);
      setPlainPassword(plain);
      setRevealed(true);
      setRevealCountdown(REVEAL_DURATION);

      revealTimerRef.current = setInterval(() => {
        setRevealCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(revealTimerRef.current);
            setRevealed(false);
            setPlainPassword(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      addToast('Failed to decrypt password', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      const plain = plainPassword || await revealPassword(entry.encrypted_password);
      await copyToClipboard(plain);
      setCopied(true);
      setCopyCountdown(COPY_CLEAR_DURATION);
      addToast('Password copied to clipboard', 'success');

      clearInterval(copyTimerRef.current);
      copyTimerRef.current = setInterval(() => {
        setCopyCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(copyTimerRef.current);
            setCopied(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      addToast('Failed to copy password', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    try {
      await onDelete(entry.id);
      addToast('Entry deleted', 'info');
    } catch {
      addToast('Failed to delete entry', 'error');
    }
  };

  const siteInitial = (entry.site || '?').charAt(0).toUpperCase();
  const siteColors = [
    'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-blue-600',
    'bg-teal-600', 'bg-green-600', 'bg-orange-600', 'bg-red-600',
  ];
  const colorIndex = entry.site.charCodeAt(0) % siteColors.length;

  return (
    <div className="card-hover group animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${siteColors[colorIndex]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {siteInitial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{entry.site}</h3>
          <p className="text-xs text-slate-500 truncate">{entry.username}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className={`p-1.5 rounded-md transition-colors ${showDeleteConfirm ? 'text-red-400 bg-red-400/20' : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'}`}
            title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete'}
            onBlur={() => setShowDeleteConfirm(false)}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800/40 rounded-lg text-xs text-red-400 text-center">
          Click delete again to confirm
        </div>
      )}

      {/* Password field */}
      <div className="bg-navy-900 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
        <span className="flex-1 font-mono text-sm text-slate-300 truncate">
          {revealed && plainPassword ? plainPassword : '••••••••••••'}
        </span>
        {revealed && revealCountdown > 0 && (
          <span className="text-xs text-slate-600 flex-shrink-0 font-mono">
            {revealCountdown}s
          </span>
        )}
        <button
          onClick={handleReveal}
          className="flex-shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
          title={revealed ? 'Hide password' : 'Reveal password'}
        >
          {revealed ? (
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

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          {copied ? (
            <span className="text-xs text-green-400 font-mono">
              Copied! Clears in {copyCountdown}s
            </span>
          ) : (
            <BreachChecker encryptedPassword={entry.encrypted_password} vaultKey={vaultKey} />
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-700/30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
      </div>
    </div>
  );
}
