
import React from 'react';

export type BadgeVariant = 
  | 'received' 
  | 'dispatched' 
  | 'loaded' 
  | 'transit' 
  | 'in_transit' 
  | 'in-transit' 
  | 'delivered' 
  | 'completed'
  | 'exception' 
  | 'failed' 
  | 'invoiced' 
  | 'neutral' 
  | 'pending' 
  | 'cancelled' 
  | 'high' 
  | 'medium' 
  | 'low' 
  | 'outbound'
  | 'ready_for_dispatch'
  | 'validated';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Human-readable form of a machine status: "READY_FOR_DISPATCH" →
 * "Ready for dispatch". Rendering contexts that want uppercase apply it
 * with CSS — never show raw snake_case to users.
 */
export const statusLabel = (status: string): string => {
  const words = status.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variants: Record<BadgeVariant, string> = {
    received: "bg-blue/10 text-brand border-blue/20",
    dispatched: "bg-brand/10 text-brand border-brand/20",
    loaded: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    transit: "bg-amber/10 text-amber border-amber/20",
    in_transit: "bg-amber/10 text-amber border-amber/20",
    'in-transit': "bg-amber/10 text-amber border-amber/20",
    delivered: "bg-emerald/10 text-emerald border-emerald/20",
    completed: "bg-emerald/10 text-emerald border-emerald/20",
    exception: "bg-red/10 text-red border-red/20",
    failed: "bg-red/20 text-red border-red/30",
    invoiced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    neutral: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/10",
    pending: "bg-amber/10 text-amber border-amber/20",
    cancelled: "bg-red/20 text-red border-red/30",
    high: "bg-[#ef4444] text-white border-[#ef4444]",
    medium: "bg-[#f59e0b] text-white border-[#f59e0b]",
    low: "bg-[#64748b] text-white border-[#64748b]",
    outbound: "bg-[#0891b2] text-white border-[#0891b2]",
    ready_for_dispatch: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    validated: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${variants[variant] ?? variants.neutral} ${className}`}>
      {typeof children === 'string' ? statusLabel(children) : children}
    </span>
  );
};
