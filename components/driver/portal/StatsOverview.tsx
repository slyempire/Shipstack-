
import React from 'react';
import { Clock, Activity, Package } from 'lucide-react';

interface StatsOverviewProps {
  driveTime: number;
  ecoScore: number;
  dnsCount: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ driveTime, ecoScore, dnsCount }) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Clock size={16} />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Duty Time</p>
          <h3 className="text-sm font-bold text-white tracking-tight">{formatTime(driveTime)}</h3>
        </div>
      </div>
      
      <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Activity size={16} />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
          <h3 className="text-sm font-bold text-white tracking-tight">{ecoScore}%</h3>
        </div>
      </div>

      <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shadow-lg flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
          <Package size={16} />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Items</p>
          <h3 className="text-sm font-bold text-white tracking-tight">{dnsCount} Units</h3>
        </div>
      </div>
    </div>
  );
};
