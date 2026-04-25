
import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationToast = () => {
  const { notifications, dismissNotification } = useAppStore();

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        const oldest = notifications[notifications.length - 1];
        if (oldest) dismissNotification(oldest.id);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;
  
  // Only show the most recent 3 toasts to avoid clutter
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {visibleNotifications.map((n) => (
        <div 
          key={n.id} 
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-4 duration-300 ${
            n.type === 'success' ? 'bg-white border-green-100 text-green-800' : 
            n.type === 'error' ? 'bg-white border-red-100 text-red-800' : 
            'bg-white border-blue-100 text-blue-800'
          }`}
        >
          {n.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
          {n.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
          {n.type === 'info' && <Info size={18} className="text-blue-500" />}
          <span className="text-xs font-bold">{n.message}</span>
          <button 
            onClick={() => dismissNotification(n.id)}
            className="ml-2 p-1 hover:bg-slate-50 rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
