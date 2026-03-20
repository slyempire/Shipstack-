
import React from 'react';

export type BadgeVariant = 'received' | 'dispatched' | 'loaded' | 'transit' | 'delivered' | 'exception' | 'failed' | 'invoiced' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variants: Record<BadgeVariant, string> = {
    received: "bg-slate-100 text-slate-500 border-slate-200",
    dispatched: "bg-blue-50 text-brand-accent border-blue-100",
    loaded: "bg-indigo-50 text-indigo-700 border-indigo-100",
    transit: "bg-cyan-50 text-cyan-700 border-cyan-100",
    delivered: "bg-emerald-50 text-brand-teal border-emerald-100",
    exception: "bg-amber-50 text-amber-600 border-amber-100",
    failed: "bg-red-50 text-red-600 border-red-100",
    invoiced: "bg-purple-50 text-purple-700 border-purple-100",
    neutral: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
