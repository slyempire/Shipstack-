
import React from 'react';

export type BadgeVariant = 'received' | 'dispatched' | 'loaded' | 'transit' | 'delivered' | 'exception' | 'failed' | 'invoiced' | 'neutral' | 'pending' | 'cancelled' | 'high' | 'medium' | 'low' | 'outbound';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variants: Record<BadgeVariant, string> = {
    received: "bg-brand/10 text-brand border-brand/20",
    dispatched: "bg-brand/10 text-brand border-brand/20",
    loaded: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    transit: "bg-amber/10 text-amber border-amber/20",
    delivered: "bg-emerald/10 text-emerald border-emerald/20",
    exception: "bg-red/10 text-red border-red/20",
    failed: "bg-red/20 text-red border-red/30",
    invoiced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    neutral: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/10",
    pending: "bg-amber/10 text-amber border-amber/20",
    cancelled: "bg-red/20 text-red border-red/30",
    high: "bg-red text-white border-red",
    medium: "bg-amber text-white border-amber",
    low: "bg-slate-500 text-white border-slate-500",
    outbound: "bg-brand-teal text-white border-brand-teal"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
