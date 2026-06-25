
import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Dismiss durations (ms) per notification type
// Errors persist longer so users can read them; success/info dismiss quickly
const DISMISS_DURATION: Record<string, number> = {
  success: 3500,
  info:    3000,
  warning: 5000,
  error:   0, // 0 = no auto-dismiss — user must manually close
};

export const NotificationToast = () => {
  const { notifications, clearNotification } = useAppStore();

  // Per-notification auto-dismiss timer
  useEffect(() => {
    if (notifications.length === 0) return;
    const oldest = notifications[notifications.length - 1];
    if (!oldest) return;
    const duration = DISMISS_DURATION[oldest.type] ?? 3500;
    if (duration === 0) return; // errors don't auto-dismiss
    const timer = setTimeout(() => clearNotification(oldest.id), duration);
    return () => clearTimeout(timer);
  }, [notifications, clearNotification]);

  if (notifications.length === 0) return null;

  const visibleNotifications = notifications.slice(0, 4);

  const iconMap: Record<string, React.ReactNode> = {
    success: <CheckCircle  size={16} className="text-emerald-500 shrink-0" />,
    error:   <AlertCircle  size={16} className="text-red-500    shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
    info:    <Info          size={16} className="text-blue-500  shrink-0" />,
  };

  const colorMap: Record<string, string> = {
    success: 'border-emerald-100 bg-white text-slate-800',
    error:   'border-red-100   bg-white text-slate-800',
    warning: 'border-amber-100 bg-white text-slate-800',
    info:    'border-blue-100  bg-white text-slate-800',
  };

  const accentMap: Record<string, string> = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    warning: 'bg-amber-500',
    info:    'bg-blue-500',
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {visibleNotifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 48, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={`pointer-events-auto flex items-start gap-3 pl-4 pr-3 py-3.5 rounded-xl shadow-xl border max-w-[340px] overflow-hidden relative ${colorMap[n.type] ?? colorMap.info}`}
            role={n.type === 'error' ? 'alert' : 'status'}
          >
            {/* Left accent bar */}
            <span className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${accentMap[n.type] ?? accentMap.info}`} aria-hidden="true" />

            {iconMap[n.type] ?? iconMap.info}

            <span className="text-[13px] font-medium flex-1 leading-snug" style={{ textTransform: 'none' }}>
              {n.message}
            </span>

            <button
              onClick={() => clearNotification(n.id)}
              className="ml-1 p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF5722]"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
