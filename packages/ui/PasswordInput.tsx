
import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Check, X, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showStrength?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ label, showStrength, ...props }) => {
  const [show, setShow] = useState(false);
  const value = props.value as string || '';

  const requirements = useMemo(() => [
    { label: '8+ Characters', met: value.length >= 8 },
    { label: '1+ Number', met: /[0-9]/.test(value) },
    { label: '1+ Special Case', met: /[^A-Za-z0-9]/.test(value) },
    { label: 'Mixed Casing', met: /[a-z]/.test(value) && /[A-Z]/.test(value) }
  ], [value]);

  const score = requirements.filter(r => r.met).length;
  
  const strengthColor = useMemo(() => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [score]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end mb-1.5 ml-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {showStrength && value && (
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${strengthColor.replace('bg-', 'text-')} bg-opacity-10`}>
            {score <= 1 ? 'Vulnerable' : score <= 3 ? 'Securing' : 'Fortified'}
          </span>
        )}
      </div>
      
      <div className="relative group">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-slate-900 font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300 pr-16 ${props.className || ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-brand-accent transition-colors"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${strengthColor} transition-all duration-500`} 
              style={{ width: `${(score / 4) * 100}%` }} 
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {requirements.map(req => (
              <div key={req.label} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {req.met ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tight ${req.met ? 'text-slate-900' : 'text-slate-400'}`}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
