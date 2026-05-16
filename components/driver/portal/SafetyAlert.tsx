
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SafetyAlertProps {
  message: string;
}

export const SafetyAlert: React.FC<SafetyAlertProps> = ({ message }) => {
  return (
    <div className="fixed top-24 left-4 right-4 z-[9000] animate-in slide-in-from-top-8 duration-300">
       <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20">
          <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
             <AlertTriangle size={24} />
          </div>
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Safety Alert</p>
             <p className="text-sm font-black uppercase tracking-tight">{message}</p>
          </div>
       </div>
    </div>
  );
};
