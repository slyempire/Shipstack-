import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:border-brand focus:bg-white outline-none transition-all ${leftIcon ? 'pl-14' : ''} ${error ? 'border-rose-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
