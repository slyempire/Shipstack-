import React from 'react';

interface EmptyStateProps {
  /** Optional decorative icon shown above the heading. */
  icon?: React.ReactNode;
  /** Short, scannable heading. Should not be a full sentence. */
  title: string;
  /** Helpful one-line description of what's missing and (ideally) what to do next. */
  description: string;
  /** Primary action label. Required if onAction is set. */
  actionLabel?: string;
  /** Click handler for the primary action. Required if actionLabel is set. */
  onAction?: () => void;
  /** Optional secondary action ('Learn more' style). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Extra container classes (margins, sizing). */
  className?: string;
}

/**
 * Standard empty-state placeholder for list views, modals, and tabs.
 * Goal: replace blank panels with a clear "here's what's missing and how to
 * fix it" prompt. The copy here should be in the agreed plain-and-friendly
 * voice — short title, helpful description, one obvious next step.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 px-8 ${className}`}>
    {icon && (
      <div className="h-16 w-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6">
        {icon}
      </div>
    )}
    <h3 className="text-xl font-black tracking-tight text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md mb-6">{description}</p>
    {(actionLabel || secondaryLabel) && (
      <div className="flex flex-wrap gap-3 justify-center">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand transition-all active:scale-95"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    )}
  </div>
);

export default EmptyState;
