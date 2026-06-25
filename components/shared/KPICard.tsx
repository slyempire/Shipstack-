import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MiniSparkline } from '../DashboardCharts';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type KPICardVariant = 
  | 'glass-marketing'
  | 'glass-login'
  | 'mock-showcase'
  | 'console-light'
  | 'console-dark'
  | 'facility-dark'
  | 'driver-light';

export interface KPICardProps {
  variant: KPICardVariant;
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string; // Hex color for glass variants, Tailwind classes for others
  chipClass?: string; // used for mock-showcase
  subValue?: string;
  trend?: number;
  status?: 'success' | 'warning' | 'critical' | 'default'; // used in console-dark
  delay?: number;
  index?: number;
  reduceMotion?: boolean;
}

export const KPICard: React.FC<KPICardProps> = React.memo(({
  variant,
  icon: Icon,
  label,
  value,
  color = '#FF5722',
  chipClass,
  subValue,
  trend,
  status = 'default',
  delay = 0,
  index = 0,
  reduceMotion
}) => {
  const systemReducedMotion = useReducedMotion();
  const prefersReducedMotion = reduceMotion !== undefined ? reduceMotion : systemReducedMotion;

  // Stable deterministic sparkline data based on label so it doesn't jump
  const sparkData = useMemo(() => {
    const seed = String(label || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 7 }, (_, i) => ({ value: 20 + (Math.sin(seed + i * 0.9) + 1) * 12 }));
  }, [label]);

  if (variant === 'glass-marketing') {
    return (
      <motion.div
        className="kpi-float-card flex items-center gap-4 w-64"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? {} : { y: [0, -6, 0], opacity: 1 }}
        transition={
          prefersReducedMotion 
            ? { duration: 0 }
            : { duration: 4 + index, repeat: Infinity, ease: 'easeInOut', delay: delay || index * 0.6 }
        }
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          aria-hidden="true"
        >
          <Icon size={17} style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.18em] leading-none mb-0.5">
            {label}
          </p>
          <p className="text-[16px] font-black text-white leading-none">{value}</p>
        </div>
      </motion.div>
    );
  }

  if (variant === 'glass-login') {
    return (
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="kpi-float-card flex items-center gap-4 w-full"
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          aria-hidden="true"
        >
          <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
          <p className="text-[15px] font-black text-white leading-none">{value}</p>
        </div>
      </motion.div>
    );
  }

  if (variant === 'mock-showcase') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${chipClass}`} aria-hidden="true">
            <Icon size={16} />
          </span>
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span className="sr-only">{trend > 0 ? 'Increased by' : 'Decreased by'}</span>
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">{value}</p>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{label}</p>
        </div>
        <div aria-hidden="true">
          <MiniSparkline data={sparkData} color={color} />
        </div>
      </div>
    );
  }

  if (variant === 'console-dark' || variant === 'facility-dark') {
    if (variant === 'facility-dark') {
      return (
        <div className="bg-charcoal border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden h-full w-full">
          <Icon className="absolute -right-8 -bottom-8 opacity-5" size={160} aria-hidden="true" />
          <div>
            <p className="label-logistics mb-2">{label}</p>
            <h3 className="text-4xl font-black tracking-tighter text-white">{value}</h3>
          </div>
          {subValue && (
            <div className={`flex items-center gap-2 mt-4 ${trend && trend > 0 ? 'text-emerald' : 'text-red'}`}>
              {trend && trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className={`label-logistics !mb-0 ${trend && trend > 0 ? '!text-emerald' : '!text-red'}`}>{subValue}</span>
            </div>
          )}
        </div>
      );
    }
    
    // console-dark (DispatchDashboard)
    return (
      <motion.div 
        initial={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay || 0.05 * index, duration: 0.5, type: "spring", stiffness: 100 }}
        whileHover={prefersReducedMotion ? {} : { y: -8, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)" }}
        className={`bg-charcoal rounded-2xl border-l-4 p-6 shadow-2xl transition-all group cursor-default ${
          status === 'success' ? 'border-l-emerald shadow-emerald/5' : 
          status === 'warning' ? 'border-l-amber shadow-amber/5' : 
          status === 'critical' ? 'border-l-red shadow-red/5' : 
          'border-l-brand shadow-brand/5'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl transition-transform group-hover:scale-110 bg-navy text-white/80">
            <Icon size={20} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          </div>
        </div>
        {subValue && (
          <div className="pt-4 border-t border-white/5 flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{subValue}</span>
          </div>
        )}
      </motion.div>
    );
  }

  if (variant === 'driver-light') {
    return (
      <div className="card-tactical !p-5 flex flex-col justify-between">
        <Icon className={`${color} mb-3`} size={20} />
        <p className="label-mono mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    );
  }

  // default to console-light (AdminDashboard / OrderManagement)
  return (
    <motion.div 
      initial={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay || 0.05 * index, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={prefersReducedMotion ? {} : { y: -8, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)" }}
      className="card-logistics flex flex-col justify-between group cursor-default"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-xl transition-all group-hover:scale-110 shadow-sm ${color}`}>
          <Icon size={24} />
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-3">
             <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{value}</h3>
          </div>
        </div>
      </div>
      {(trend !== undefined || subValue) && (
        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div aria-hidden="true">
              <MiniSparkline data={sparkData} color={trend !== undefined && trend > 0 ? '#10B981' : '#EF4444'} />
            </div>
            {subValue && <span className="text-[10px] font-medium text-gray-400">{subValue}</span>}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald' : 'text-red'}`}>
              <span className="sr-only">{trend > 0 ? 'Increased by' : 'Decreased by'}</span>
              <span aria-hidden="true">{trend > 0 ? '↑' : '↓'}</span> {Math.abs(trend)}%
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

KPICard.displayName = 'KPICard';
