import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  rightAction,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md ${className}`}>
      {(title || icon || rightAction) && (
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{title}</h3>}
              {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
            </div>
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-8'}>
        {children}
      </div>
    </div>
  );
};
