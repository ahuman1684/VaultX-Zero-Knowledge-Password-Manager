import { useState, useCallback } from 'react';
import { generatePassword } from '../crypto';
import StrengthMeter from './StrengthMeter';

export default function PasswordGenerator({ onUse }) {
  const [options, setOptions] = useState({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState(() =>
    generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true })
  );
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback((newOptions = options) => {
    const generated = generatePassword(newOptions);
    setPassword(generated);
    setCopied(false);
  }, [options]);

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value };
    // Ensure at least one charset is active
    const anyActive = ['uppercase', 'lowercase', 'numbers', 'symbols'].some((k) => newOptions[k]);
    if (!anyActive) return;
    setOptions(newOptions);
    regenerate(newOptions);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Generated password display */}
      <div className="relative">
        <div className="bg-navy-900 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-indigo-300 break-all min-h-[3rem] flex items-center">
          {password || <span className="text-slate-600">Select options above</span>}
        </div>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <StrengthMeter password={password} />

      {/* Length slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Length</span>
          <span className="font-mono font-bold text-indigo-400">{options.length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={(e) => handleOptionChange('length', parseInt(e.target.value, 10))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-600">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      {/* Charset toggles */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'uppercase', label: 'Uppercase (A–Z)' },
          { key: 'lowercase', label: 'Lowercase (a–z)' },
          { key: 'numbers', label: 'Numbers (0–9)' },
          { key: 'symbols', label: 'Symbols (!@#…)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => handleOptionChange(key, e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => regenerate()}
          className="flex-1 btn-secondary text-sm py-2"
        >
          ↺ Regenerate
        </button>
        {onUse && (
          <button
            onClick={() => onUse(password)}
            className="flex-1 btn-primary text-sm py-2"
          >
            Use This Password
          </button>
        )}
      </div>
    </div>
  );
}
