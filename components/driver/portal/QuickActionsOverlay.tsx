
import React from 'react';
import { X, CheckCircle, AlertTriangle, PhoneCall, CloudRain } from 'lucide-react';

interface QuickActionsOverlayProps {
  onClose: () => void;
  onMarkDelivered: () => void;
  onReportIssue: () => void;
  onCallDispatch: () => void;
  onShowAdvisories: () => void;
}

export const QuickActionsOverlay: React.FC<QuickActionsOverlayProps> = ({
  onClose,
  onMarkDelivered,
  onReportIssue,
  onCallDispatch,
  onShowAdvisories
}) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-6 bg-[#0a0f1a]/80 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Quick Actions</h3>
                <p className="text-xs text-slate-500 mt-1">Select an action to continue</p>
             </div>
             <button onClick={onClose} className="h-10 w-10 bg-slate-800 rounded-xl text-slate-400 flex items-center justify-center border border-slate-700/50 transition-colors hover:text-white active:scale-90">
               <X size={20}/>
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={onMarkDelivered}
               className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
             >
                <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                   <CheckCircle size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Mark Delivered</span>
             </button>
             <button 
               onClick={onReportIssue}
               className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
             >
                <div className="h-12 w-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                   <AlertTriangle size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">Report Issue</span>
             </button>
             <button 
               onClick={onCallDispatch}
               className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
             >
                <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                   <PhoneCall size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Call Dispatch</span>
             </button>
             <button 
               onClick={onShowAdvisories}
               className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center"
             >
                <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                   <CloudRain size={24} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Advisories</span>
             </button>
          </div>
       </div>
    </div>
  );
};
