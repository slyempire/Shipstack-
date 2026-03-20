import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: any;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    delivered: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    exception: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
    failed: 'bg-rose-100 text-rose-600',
    info: 'bg-indigo-100 text-indigo-600',
    neutral: 'bg-slate-100 text-slate-600'
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${variantClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
