
import React from 'react';
import { X, Truck, CreditCard, ShieldCheck, AlertCircle, Activity, Navigation2, MessageSquare, CloudRain, User as UserIcon, Settings, LogOut, ChevronRight } from 'lucide-react';
import { User } from '../../../types';

interface DriverHubMenuProps {
  user: User | null;
  onClose: () => void;
  onNavigate: (path: string | 'LIST' | 'WALLET' | 'SAFETY_PASSPORT' | 'INSPECTION' | 'NOTIFICATIONS' | 'FLEET_MAP' | 'CHAT' | 'ADVISORIES') => void;
  onClockOut: () => void;
  onLogout: () => void;
}

export const DriverHubMenu: React.FC<DriverHubMenuProps> = ({
  user,
  onClose,
  onNavigate,
  onClockOut,
  onLogout
}) => {
  return (
    <div className="fixed inset-0 z-[5000] bg-[#0a0f1a]/95 backdrop-blur-2xl flex flex-col p-6 animate-in fade-in duration-300">
       <header className="flex justify-between items-center mb-10 pt-8 px-2">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                {user?.name?.charAt(0) || '?'}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-[#0a0f1a]" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">{user?.name}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {user?.id.split('-')[1] || '772'} • On Duty</p>
             </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all">
             <X size={24} />
          </button>
       </header>

        <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
           {/* Primary Operations Grid */}
           <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'LIST', label: 'Manifest', sub: 'Current Run', icon: Truck, color: 'bg-brand' },
                { id: 'INSPECTION', label: 'Inspection', sub: 'Safety Check', icon: ShieldCheck, color: 'bg-emerald-500' },
                { id: 'WALLET', label: 'Wallet', sub: 'Finance', icon: CreditCard, color: 'bg-slate-800' },
                { id: 'CHAT', label: 'Dispatch', sub: 'Direct Comms', icon: MessageSquare, color: 'bg-indigo-500' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col gap-3 group active:bg-white/10 transition-all text-left"
                >
                  <div className={`h-10 w-10 rounded-xl ${item.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{item.label}</h4>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{item.sub}</p>
                  </div>
                </button>
              ))}
           </div>

           {/* Secondary Services List */}
           <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-2">Fleet Services</p>
              {[
                { id: 'FLEET_MAP', label: 'Network Visibility', icon: Navigation2 },
                { id: 'SAFETY_PASSPORT', label: 'ISO Safety Passport', icon: Activity },
                { id: 'ADVISORIES', label: 'Route Intelligence', icon: CloudRain },
                { id: 'NOTIFICATIONS', label: 'Alerts & Bulletins', icon: AlertCircle },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className="w-full flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 active:bg-white/10 transition-all group"
                >
                  <item.icon size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                  <ChevronRight size={14} className="ml-auto text-slate-600" />
                </button>
              ))}
           </div>

           {/* Settings & Profile */}
           <div className="flex gap-2">
              <button 
                onClick={() => onNavigate('/profile')}
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 flex items-center justify-center gap-3 active:bg-white/10 transition-all"
              >
                <UserIcon size={16} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Profile</span>
              </button>
              <button 
                onClick={() => onNavigate('/settings')}
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 flex items-center justify-center gap-3 active:bg-white/10 transition-all"
              >
                <Settings size={16} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Settings</span>
              </button>
           </div>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-3">
           <button 
             onClick={onClockOut}
             className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl shadow-red-500/20"
           >
              <LogOut size={18} /> End Shift
           </button>
           <button 
             onClick={onLogout}
             className="w-full py-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
           >
              Terminate Session
           </button>
        </div>
    </div>
  );
};
