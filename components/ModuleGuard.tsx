
import React from 'react';
import { motion } from 'framer-motion';
import { useTenant } from '../hooks/useTenant';
import { ModuleId } from '../types';
import { PLAN_HIERARCHY, CORE_MODULE_MIN_PLAN, MODULE_TIER_MIN_PLAN, AVAILABLE_MODULES } from '../constants';
import { PaywallView } from './ModuleGuard/PaywallView';
import { ModuleLockedView } from './ModuleGuard/ModuleLockedView';

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
}

/**
 * ModuleGuard protects routes based on tenant plan and module enablement.
 * Plan hierarchy: STARTER (0) < GROWTH (1) < SCALE (2) < ENTERPRISE (3)
 *
 * Two layers of checks:
 * 1. Paywall — is the tenant's current plan high enough to use this module?
 * 2. Module locked — is this module enabled in the tenant's enabledModules list?
 */
export const ModuleGuard: React.FC<ModuleGuardProps> = ({ moduleId, children }) => {
  try {
    const { isModuleEnabled, tenant } = useTenant();

    if (!moduleId) return <>{children}</>;

    if (!tenant) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full"
          />
        </div>
      );
    }

    const currentPlan = (tenant.plan as string)?.toUpperCase() || 'STARTER';
    const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0;

    // Check if the core module has a minimum plan requirement
    const coreMinPlan = CORE_MODULE_MIN_PLAN[moduleId];
    if (coreMinPlan) {
      const requiredLevel = PLAN_HIERARCHY[coreMinPlan] ?? 0;
      if (currentLevel < requiredLevel) {
        return <PaywallView moduleId={moduleId} requiredPlan={coreMinPlan} />;
      }
    }

    // Check marketplace module tier requirement
    const moduleDef = AVAILABLE_MODULES.find(m => m.id === moduleId || m.slug === moduleId);
    if (moduleDef && !moduleDef.isCore) {
      const tierMinPlan = MODULE_TIER_MIN_PLAN[moduleDef.tier] ?? 'STARTER';
      const requiredLevel = PLAN_HIERARCHY[tierMinPlan] ?? 0;
      if (currentLevel < requiredLevel) {
        return <PaywallView moduleId={moduleId} requiredPlan={tierMinPlan} />;
      }
    }

    // Module enablement check (tenant.enabledModules array)
    if (!isModuleEnabled(moduleId)) {
      return <ModuleLockedView moduleId={moduleId} />;
    }

    return <>{children}</>;

  } catch (error: any) {
    console.error('ModuleGuard error:', error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-red-100 text-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Check Failed</h2>
          <p className="text-sm text-slate-500 mb-6">
            There was a problem verifying your module access. This is usually a temporary issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] text-left overflow-auto max-h-40 text-slate-400 font-mono">
              {error?.message}{'\n'}{error?.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
};
