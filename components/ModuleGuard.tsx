
import React from 'react';
import { motion } from 'framer-motion';
import { useTenant } from '../hooks/useTenant';
import { ModuleId } from '../types';
import { PaywallView } from './ModuleGuard/PaywallView';
import { ModuleLockedView } from './ModuleGuard/ModuleLockedView';

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
}

/**
 * ModuleGuard component protects routes based on tenant plan and module enablement.
 * It handles:
 * 1. Plan-based access (Paywall)
 * 2. Tenant-based enablement (Module Locked)
 * 3. Role-based access (handled via ProtectedRoute, but reinforced here)
 */
export const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children }) => {
  try {
    const { isModuleEnabled, tenant } = useTenant();

    // 1. Basic validation
    if (!moduleId) {
      return <>{children}</>;
    }

    // 2. Loading state protection
    if (!tenant) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full"
          />
        </div>
      );
    }

    // 3. Plan-based access check
    const isPremiumModule = (id: ModuleId): 'PRO' | 'ENTERPRISE' | undefined => {
      const premiumModules: Partial<Record<ModuleId, 'PRO' | 'ENTERPRISE'>> = {
        'fleet': 'PRO',
        'finance': 'PRO',
        'analytics': 'PRO',
        'integrations': 'ENTERPRISE'
      };
      return premiumModules[id];
    };

    const requiredPlan = isPremiumModule(moduleId);
    const currentPlan = tenant.plan || 'BASIC';

    if (requiredPlan) {
      const planHierarchy: Record<string, number> = { 'BASIC': 0, 'PRO': 1, 'ENTERPRISE': 2 };
      const currentLevel = planHierarchy[currentPlan] ?? 0;
      const requiredLevel = planHierarchy[requiredPlan] ?? 0;
      
      if (currentLevel < requiredLevel) {
        return <PaywallView moduleId={moduleId} requiredPlan={requiredPlan} />;
      }
    }

    // 4. Module enablement check
    if (!isModuleEnabled(moduleId)) {
      return <ModuleLockedView moduleId={moduleId} />;
    }

    // 5. All checks passed
    return <>{children}</>;

  } catch (error: any) {
    // Definitive crash protection
    console.error('Critical Error in ModuleGuard:', error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-red-100 text-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Security Module Error</h2>
          <p className="text-sm text-slate-500 mb-6">
            There was a problem verifying your access permissions. This might be due to a temporary connection issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] text-left overflow-auto max-h-40 text-slate-400 font-mono">
              {error?.message}
              {'\n'}
              {error?.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
};
