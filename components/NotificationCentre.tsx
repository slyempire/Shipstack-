
import React from 'react';
import { useAppStore } from '../store';
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Settings, 
  CreditCard, 
  ShieldCheck, 
  Boxes,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCentreProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'BILLING': return <CreditCard size={16} />;
    case 'SECURITY': return <ShieldCheck size={16} />;
    case 'MODULES': return <Boxes size={16} />;
    case 'OPERATIONS': return <AlertCircle size={16} />;
    default: return <Bell size={16} />;
  }
};

export const NotificationCentre: React.FC<NotificationCentreProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markRead, 
    markAllRead, 
    dismissNotification,
    unreadCount 
  } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<string>('ALL');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNREAD') return !n.read;
    return n.category === activeTab;
  });

  const categories = ['ALL', 'UNREAD', 'BILLING', 'SECURITY', 'MODULES', 'OPERATIONS'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[2000]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-[2001] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Notification Centre</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {unreadCount} Unread Logs
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === cat ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between bg-white">
               <button 
                 onClick={markAllRead}
                 className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline"
               >
                 Mark All Read
               </button>
               <button 
                 className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 flex items-center gap-1"
               >
                 <Settings size={10} /> Alert Config
               </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center">
                   <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Bell size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No notifications found</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <motion.div 
                    layout
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all relative group ${n.read ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-brand/20 shadow-sm shadow-brand/5'}`}
                  >
                    {!n.read && (
                      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                        n.type === 'error' ? 'bg-red-50 text-red-500' :
                        n.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <CategoryIcon category={n.category} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                             n.category === 'BILLING' ? 'bg-amber-100 text-amber-600' :
                             n.category === 'SECURITY' ? 'bg-red-100 text-red-600' :
                             n.category === 'MODULES' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'
                           }`}>
                             {n.category}
                           </span>
                           <span className="text-[8px] font-bold text-slate-300 uppercase">
                             {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                           </span>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 mb-1 leading-tight">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                        
                        {n.action && (
                          <button 
                            onClick={() => { navigate(n.action!.path); onClose(); }}
                            className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-brand hover:gap-2 transition-all"
                          >
                            {n.action.label} <ExternalLink size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                       {!n.read && (
                         <button 
                           onClick={() => markRead(n.id)}
                           className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-all"
                         >
                           <ShieldCheck size={12} />
                         </button>
                       )}
                       <button 
                         onClick={() => dismissNotification(n.id)}
                         className="p-1.5 bg-slate-50 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Platform Banner */}
            <div className="p-6 bg-slate-900 text-white italic text-[10px] font-medium text-center opacity-50">
              Shipstack Terminal v3.2 · Integrated Ops
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCentre;
