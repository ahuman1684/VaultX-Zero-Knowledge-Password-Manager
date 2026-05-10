import { calculateEntropy, entropyToStrength } from '../crypto';

export default function StrengthMeter({ password }) {
  if (!password) return null;

  const bits = calculateEntropy(password);
  const { label, color, textColor, pct } = entropyToStrength(bits);

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full strength-bar ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-semibold ${textColor}`}>{label}</span>
        <span className="text-slate-500 font-mono">{Math.round(bits)} bits</span>
      </div>
    </div>
  );
}
