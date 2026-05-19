
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import SecurityAudit from './SecurityAudit';
import SecurityRolesView from './SecurityRolesView';
import DiagnosticsView from './DiagnosticsView';
import { 
  ShieldCheck, 
  History, 
  Lock, 
  Activity,
  Shield,
  Zap,
  LockIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';
import { useModuleStore } from '../../store';
import { Badge } from '../../packages/ui/Badge';
import { useNavigate } from 'react-router-dom';

const SecurityCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<'AUDIT' | 'RBAC' | 'DIAGNOSTICS'>('AUDIT');
  const { isModuleInstalled } = useModuleStore();
  const navigate = useNavigate();

  const isRbacInstalled = isModuleInstalled('security-rbac');
  const isDiagnosticsInstalled = isModuleInstalled('security-diagnostics');

  const tabs = [
    { id: 'AUDIT' as const, label: 'Audit Ledger', icon: History, desc: 'Immutable action logs', installed: true },
    { id: 'RBAC' as const, label: 'RBAC Protocols', icon: Shield, desc: 'Access & Permissions', installed: isRbacInstalled },
    { id: 'DIAGNOSTICS' as const, label: 'Diagnostics', icon: Zap, desc: 'Infrastructure Health', installed: isDiagnosticsInstalled },
  ];

  const UpsellView = ({ moduleId, name, desc }: { moduleId: string, name: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center animate-in fade-in duration-500">
      <div className="h-24 w-24 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-8">
        <LockIcon size={48} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4">{name} Module Locked</h3>
      <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed mb-10 text-sm">
        {desc} This capability is part of our advanced security cluster and requires separate provisioning.
      </p>
      <button 
        onClick={() => navigate('/admin/marketplace')}
        className="px-8 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center gap-3"
      >
        <Plus size={16} /> Provision in Marketplace
      </button>
    </div>
  );

  return (
    <RoleGuard permissions={['security:view']} showFullPageError>
      <Layout 
        title="Security Command" 
        subtitle="Unified operational security & access control cluster"
      >
        <div className="space-y-12 pb-32">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap gap-4 p-3 bg-slate-100/50 rounded-[2.5rem] border border-slate-100 max-w-fit shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-10 py-5 rounded-[2rem] transition-all flex items-center gap-4 group ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-2xl' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-lg' : 'bg-slate-200/50 text-slate-400 group-hover:text-slate-500'}`}>
                   <tab.icon size={20} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none">{tab.label}</p>
                    {!tab.installed && <Badge variant="neutral" className="scale-75 origin-left opacity-60">LOCKED</Badge>}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 opacity-60 group-hover:opacity-100 transition-opacity">Operational Submodule</p>
                </div>
              </button>
            ))}
          </div>

          <div className="min-h-[600px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'AUDIT' && <SecurityAudit embedded />}
                {activeTab === 'RBAC' && (
                  isRbacInstalled ? <SecurityRolesView embedded /> : 
                  <UpsellView 
                    moduleId="security-rbac" 
                    name="Advanced RBAC Protocols" 
                    desc="Unlock granular permission management, custom role tiers, and tenant-level access audits." 
                  />
                )}
                {activeTab === 'DIAGNOSTICS' && (
                  isDiagnosticsInstalled ? <DiagnosticsView embedded /> : 
                  <UpsellView 
                    moduleId="security-diagnostics" 
                    name="System Diagnostics Hub" 
                    desc="Unlock real-time infrastructure monitoring, error tracing, and performance bottleneck analytics." 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
};

export default SecurityCommandCenter;
