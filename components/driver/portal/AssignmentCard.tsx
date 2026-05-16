
import React from 'react';
import { Navigation, MapPin, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { DeliveryNote, DNStatus, LogisticsType } from '../../../types';

interface AssignmentCardProps {
  dn: DeliveryNote;
  onClick: (dn: DeliveryNote) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ dn, onClick }) => {
  return (
    <button 
      onClick={() => onClick(dn)} 
      className="w-full p-4 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/40 shadow-xl flex items-center gap-4 active:scale-[0.98] transition-all text-left relative overflow-hidden group min-h-[100px]"
    >
      <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl ${dn.type === LogisticsType.INBOUND ? 'bg-brand/80' : 'bg-emerald-500/80'} text-white transition-colors`}>
        {dn.type === LogisticsType.INBOUND ? 'Inbound Pickup' : 'Outbound Delivery'}
      </div>
      
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${dn.status === DNStatus.IN_TRANSIT ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:border-emerald-500/30'}`}>
        {dn.status === DNStatus.IN_TRANSIT ? <Navigation size={26} className="animate-pulse" /> : 
          dn.type === LogisticsType.INBOUND ? <ArrowDownLeft size={26} /> : <ArrowUpRight size={26} />
        }
      </div>

      <div className="flex-1 min-w-0 space-y-1">
         <h4 className="text-white font-semibold text-[15px] leading-tight truncate transition-colors">{dn.clientName}</h4>
         <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin size={12} className="shrink-0" />
            <p className="text-[11px] font-medium truncate uppercase tracking-tight transition-colors">{dn.address}</p>
         </div>
         <div className="flex items-center gap-3 pt-1">
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors ${
              dn.status === DNStatus.IN_TRANSIT ? 'bg-blue-500/20 text-blue-400' : 
              dn.status === DNStatus.DELIVERED ? 'bg-emerald-500/20 text-emerald-400' : 
              'bg-amber-500/20 text-amber-400'
            }`}>
              {dn.status.replace('_', ' ')}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold transition-colors">
               <Clock size={12} />
               <span>ETA: 14:30</span>
            </div>
         </div>
      </div>

      <div className="flex flex-col items-end gap-2 ml-2">
         <div className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-2.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-90">
            <Navigation size={20} fill="currentColor" />
         </div>
      </div>
    </button>
  );
};
