
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../store';
import { offlineDb } from '../../../services/offlineDb';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncTracker: React.FC = () => {
  const { isOnline, syncStatus } = useAppStore();
  const { pendingCount, isSyncing, lastSyncTime } = syncStatus;
  const [showDetails, setShowDetails] = useState(false);

  // We no longer need internal polling as SyncService and OfflineDB update the store

  const statusColor = !isOnline ? 'text-amber-500' : pendingCount > 0 ? 'text-blue-400' : 'text-emerald-400';
  const bgColor = !isOnline ? 'bg-amber-500/10' : pendingCount > 0 ? 'bg-blue-500/10' : 'bg-emerald-500/10';
  const borderColor = !isOnline ? 'border-amber-500/20' : pendingCount > 0 ? 'border-blue-500/20' : 'border-emerald-500/20';

  return (
    <div className="fixed top-2 left-4 right-4 z-[1000] pointer-events-none">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center"
      >
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all ${bgColor} ${borderColor}`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-amber-500 animate-pulse" />
            )}
            <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <>
                <RefreshCw size={14} className={`text-blue-400 ${isOnline ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {pendingCount} Pending Sync
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  Fully Synced
                </span>
              </>
            )}
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {showDetails && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="mt-2 mx-auto max-w-sm pointer-events-auto bg-slate-900/90 border border-slate-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Pending Sync Queue</h4>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
              <p className="text-[9px] text-slate-400 font-medium">
                Your data is safely stored locally. Shipstack will automatically synchronize as soon as a stable connection is established.
              </p>
              {/* Could list individual updates here if we want more robust tracking */}
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white uppercase leading-none mb-1">Background Sync Active</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Automatic retries every 60s</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { X } from 'lucide-react';
