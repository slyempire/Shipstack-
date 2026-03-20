import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Rocket, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useAuthStore } from '../store';
import { ModuleId } from '../types';
import { AVAILABLE_MODULES } from '../constants';
import { api } from '../api';

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
}

const ModuleLockedView: React.FC<{ moduleId: ModuleId }> = ({ moduleId }) => {
  const moduleDef = AVAILABLE_MODULES.find(m => m.id === moduleId);
  const { user } = useAuthStore();
  const { tenant } = useTenant();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await api.createPermissionRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        moduleId: moduleId,
        reason: `Requesting access to ${moduleDef?.name || moduleId} module.`
      });
      setRequestStatus('SUCCESS');
    } catch (error) {
      console.error('Failed to request access:', error);
      setRequestStatus('ERROR');
    } finally {
      setIsRequesting(false);
    }
  };

  const isTenantDisabled = !tenant?.enabledModules?.includes(moduleId);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="relative inline-block">
          <div className="h-24 w-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400">
            <Lock size={40} />
          </div>
          <div className="absolute -right-2 -bottom-2 h-10 w-10 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Rocket size={20} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
            {moduleDef?.name || 'Module'} Locked
          </h2>
          <p className="text-slate-500 font-medium">
            {isTenantDisabled 
              ? "This feature is currently disabled for your organization. Enable it in your settings to unlock its full potential."
              : "You don't have permission to access this module. Request access from your administrator."}
          </p>
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-left space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm flex-shrink-0">
              <Rocket size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Why enable this?</h4>
              <p className="text-[11px] font-bold text-slate-500 mt-1">
                {moduleDef?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isTenantDisabled ? (
            user?.role === 'ADMIN' && (
              <Link 
                to="/settings"
                className="w-full py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Settings <ChevronRight size={16} />
              </Link>
            )
          ) : (
            requestStatus === 'SUCCESS' ? (
              <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Request Sent Successfully
              </div>
            ) : (
              <button 
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRequesting ? 'Sending Request...' : 'Request Access'} <ChevronRight size={16} />
              </button>
            )
          )}
          
          {requestStatus === 'ERROR' && (
            <p className="text-[10px] font-bold text-rose-500 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> Failed to send request. Please try again.
            </p>
          )}

          <Link 
            to="/admin"
            className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children }) => {
  const { isModuleEnabled } = useTenant();

  if (!isModuleEnabled(moduleId)) {
    return <ModuleLockedView moduleId={moduleId} />;
  }

  return <>{children}</>;
};
