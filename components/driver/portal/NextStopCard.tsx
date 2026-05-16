
import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { DeliveryNote } from '../../../types';

interface NextStopCardProps {
  dn: DeliveryNote;
}

export const NextStopCard: React.FC<NextStopCardProps> = ({ dn }) => {
  return (
    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden group transition-colors">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">Next Stop</div>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight">~12 min</span>
          </div>
          <h4 className="text-base font-bold text-white truncate transition-colors">{dn.clientName}</h4>
          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
            <MapPin size={12} className="shrink-0" />
            <p className="text-[10px] truncate transition-colors">{dn.address}</p>
          </div>
        </div>
        <button 
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dn.address)}`, '_blank')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-3 shadow-lg active:scale-95 transition-all"
        >
          <Navigation size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
