import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorViewProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
        
        <div className="h-20 w-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertTriangle size={40} />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
          Unrecoverable Error
        </h1>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The tactical interface encountered a critical exception that prevents normal operation. 
          {error?.message && (
            <span className="block mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-mono text-[10px] break-all border border-slate-100 dark:border-slate-800">
              {error.message}
            </span>
          )}
        </p>

        <div className="space-y-3">
          <button
            id="error-reload-button"
            onClick={() => resetErrorBoundary ? resetErrorBoundary() : window.location.reload()}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-slate-200 dark:shadow-none"
          >
            <RefreshCw size={18} />
            Reload Interface
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Return to Command Home
          </button>
        </div>

        <p className="mt-10 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
          Shipstack Operational Recovery Protocol v4.0
        </p>
      </motion.div>
    </div>
  );
};

export default ErrorView;
