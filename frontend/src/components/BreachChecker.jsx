import { useState } from 'react';
import { checkBreach, decryptPassword } from '../crypto';

export default function BreachChecker({ encryptedPassword, vaultKey }) {
  const [status, setStatus] = useState(null); // null | 'loading' | { breached, count } | 'error'

  const handleCheck = async () => {
    setStatus('loading');
    try {
      const plain = await decryptPassword(vaultKey, encryptedPassword);
      const result = await checkBreach(plain);
      setStatus(result);
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === null) {
    return (
      <button
        onClick={handleCheck}
        className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline underline-offset-2"
      >
        Check breaches
      </button>
    );
  }

  if (status === 'loading') {
    return (
      <span className="text-xs text-slate-500 animate-pulse-soft">Checking...</span>
    );
  }

  if (status === 'error') {
    return (
      <span className="text-xs text-red-500">Check failed — try again</span>
    );
  }

  if (status.breached) {
    return (
      <div className="flex items-start gap-1.5">
        <span className="text-xs">⚠️</span>
        <span className="text-xs text-red-400 font-medium leading-tight">
          Found in {status.count.toLocaleString()} breaches — change this password!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs">✅</span>
      <span className="text-xs text-green-400 font-medium">Not found in any known breaches</span>
    </div>
  );
}
