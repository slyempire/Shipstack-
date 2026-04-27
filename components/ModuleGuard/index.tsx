
import React from 'react';
import { useModuleStore, useAuthStore } from '../../store';
import { Lock, Zap, ArrowRight, ShieldCheck, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getModuleById } from '../../constants/modules';
import { Permission } from '../../types';
import Icon from '../Icon';

interface ModuleGuardProps {
  moduleId: string;
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const ModuleLockedView = ({ moduleId }: { moduleId: string }) => {
  const navigate = useNavigate();
  const module = getModuleById(moduleId);
  
  if (!module) return null;

  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto my-12">
      <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon name={module.icon as string} size={32} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">{module.name} Inactive</h3>
      <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
        This module is currently not provisioned for your tenant. Unlock specialized {module.category.replace('_', ' ')} capabilities by activating this solution in the marketplace.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
        {module.tags.map(tag => (
          <div key={tag} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100">
            <ShieldCheck size={14} className="text-brand" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{tag}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={() => navigate('/admin/marketplace')}
        className="w-full py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
      >
        Explore in Marketplace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
      
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6">
        {module.pricing.model === 'free' ? 'Available for Free' : `Starting at ${module.pricing.amount} ${module.pricing.currency}/mo`}
      </p>
    </div>
  );
};

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ 
  moduleId, 
  requiredPermission,
  fallback, 
  children 
}) => {
  const { isModuleActive } = useModuleStore();
  const { hasPermission } = useAuthStore();
  
  const isActive = isModuleActive(moduleId);
  const isAuthorized = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!isActive) {
    if (fallback) return <>{fallback}</>;
    return <ModuleLockedView moduleId={moduleId} />;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center p-12">
        <div className="h-14 w-14 bg-red/10 text-red rounded-2xl flex items-center justify-center mb-5">
          <ShieldOff size={28} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight text-ink mb-2">Access Denied</h3>
        <p className="text-sm text-muted font-medium max-w-xs leading-relaxed">
          Your role does not have permission to access this section. Contact your administrator to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="relative group/module">
      {/* Trial Banner would go here if needed as an overlay */}
      {children}
    </div>
  );
};

export default ModuleGuard;
