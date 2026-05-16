
import React from 'react';
import { Truck, ShieldCheck, AlertCircle, Activity, Menu } from 'lucide-react';

export type DriverTab = 'LIST' | 'SAFETY' | 'ALERTS' | 'HUB' | 'MORE';

interface DriverBottomNavProps {
  activeTab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
  hasUnreadNotifications?: boolean;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({ 
  activeTab, 
  onTabChange,
  hasUnreadNotifications 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-white/5 px-6 pb-10 pt-4 z-[100] flex justify-between items-center shadow-2xl transition-all">
      <button 
        onClick={() => onTabChange('LIST')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'LIST' ? 'text-[#FF8C42]' : 'text-slate-500 hover:text-white'}`}
        id="nav-trips"
      >
        <Truck className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'LIST' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Trips</span>
        {activeTab === 'LIST' && <div className="absolute -bottom-2 h-1 w-1 bg-[#FF8C42] rounded-full" />}
      </button>
      
      <button 
        onClick={() => onTabChange('SAFETY')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'SAFETY' ? 'text-emerald-500' : 'text-slate-500 hover:text-white'}`}
        id="nav-safety"
      >
        <ShieldCheck className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'SAFETY' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Safety</span>
        {activeTab === 'SAFETY' && <div className="absolute -bottom-2 h-1 w-1 bg-emerald-500 rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('ALERTS')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'ALERTS' ? 'text-amber-500' : 'text-slate-500 hover:text-white'}`}
        id="nav-alerts"
      >
        <AlertCircle className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'ALERTS' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Alerts</span>
        {hasUnreadNotifications && (
          <span className="absolute top-0 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-[#0a0f1a]" />
        )}
        {activeTab === 'ALERTS' && <div className="absolute -bottom-2 h-1 w-1 bg-amber-500 rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('HUB')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'HUB' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
        id="nav-hub"
      >
        <Activity className={`w-6 h-6 group-hover:scale-110 transition-transform ${activeTab === 'HUB' ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-tight">Hub</span>
        {activeTab === 'HUB' && <div className="absolute -bottom-2 h-1 w-1 bg-blue-400 rounded-full" />}
      </button>

      <button 
        onClick={() => onTabChange('MORE')} 
        className={`flex flex-col items-center gap-1.5 transition-all group relative ${activeTab === 'MORE' ? 'text-white' : 'text-slate-500 hover:text-white'}`}
        id="nav-menu"
      >
        <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Menu</span>
      </button>
    </div>
  );
};
