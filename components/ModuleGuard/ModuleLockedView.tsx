
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Rocket, ChevronRight, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useAuthStore } from '../../store';
import { ModuleId } from '../../types';
import { AVAILABLE_MODULES } from '../../constants';
import { api } from '../../api';

interface ModuleLockedViewProps {
  moduleId: ModuleId;
}

export const ModuleLockedView: React.FC<ModuleLockedViewProps> = ({ moduleId }) => {
  const moduleDef = AVAILABLE_MODULES.find(m => m.id === moduleId);
  const { user, isAuthenticated } = useAuthStore();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  if (!moduleId) return null;

  const handleBackToDashboard = () => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const currentPath = window.location.hash.replace('#', '') || window.location.pathname;
    
    if (user?.role === 'DRIVER') {
      if (currentPath.includes('/driver')) navigate('/');
      else navigate('/driver');
    }
    else if (user?.role === 'FACILITY') {
      if (currentPath.includes('/facility')) navigate('/');
      else navigate('/facility');
    }
    else if (user?.role === 'CLIENT') {
      if (currentPath.includes('/client')) navigate('/');
      else navigate('/client');
    }
    else if (user?.role === 'WAREHOUSE') {
      if (currentPath.includes('/admin/warehouse')) navigate('/');
      else navigate('/admin/warehouse');
    }
    else {
      if (currentPath.includes('/admin')) navigate('/');
      else navigate('/admin');
    }
  };

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

  const isTenantDisabled = tenant && tenant.enabledModules && Array.isArray(tenant.enabledModules) && !tenant.enabledModules.includes(moduleId);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="h-24 w-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400"
          >
            <Lock size={40} />
          </motion.div>
          <motion.div 
            initial={{ scale: 0, x: 20, y: 20 }}
            animate={{ scale: 1, x: 0, y: 0 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="absolute -right-2 -bottom-2 h-10 w-10 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Rocket size={20} />
          </motion.div>
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

        {moduleDef && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-left space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm flex-shrink-0">
                <Rocket size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Why enable this?</h4>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  {moduleDef.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          {isTenantDisabled ? (
            user?.role === 'ADMIN' && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/settings"
                  className="w-full py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center gap-2"
                >
                  Go to Settings <ChevronRight size={16} />
                </Link>
              </motion.div>
            )
          ) : (
            requestStatus === 'SUCCESS' ? (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Request Sent Successfully
              </motion.div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestAccess}
                disabled={isRequesting}
                className="w-full py-4 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRequesting ? 'Sending Request...' : 'Request Access'} <ChevronRight size={16} />
              </motion.button>
            )
          )}
          
          {requestStatus === 'ERROR' && (
            <p className="text-[10px] font-bold text-rose-500 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> Failed to send request. Please try again.
            </p>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToDashboard}
            className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
