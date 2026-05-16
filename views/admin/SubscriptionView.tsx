
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useTenantStore, useModuleStore, useAppStore } from '../../store';
import { api } from '../../api';
import { 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Boxes, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Activity,
  History as HistoryIcon,
  Download,
  AlertTriangle,
  Package,
  X,
  Star,
  Rocket,
  Shield,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';

const SubscriptionView: React.FC = () => {
  const { currentTenant, updateTenant } = useTenantStore();
  const { installedModules } = useModuleStore();
  const { addNotification } = useAppStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const activePlan = currentTenant?.plan || 'Professional';
  const monthlyCost = activePlan === 'ENTERPRISE' ? 2499 : activePlan === 'SCALE' ? 999 : activePlan === 'GROWTH' ? 499 : 99;

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter Cluster',
      desc: 'Perfect for local delivery fleets and small operations.',
      price: 99,
      icon: Rocket,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      features: ['Up to 10 vehicles', 'Basic telemetry', 'Core dispatch', 'Email support']
    },
    {
      id: 'GROWTH',
      name: 'Growth Cluster',
      desc: 'Scale your operations with advanced routing and multi-hub.',
      price: 499,
      icon: Zap,
      color: 'text-brand',
      bgColor: 'bg-brand/5',
      features: ['Up to 50 vehicles', 'Route optimization', 'AI-assisted demand', 'Hub-to-Hub mesh']
    },
    {
      id: 'SCALE',
      name: 'Scale Cluster',
      desc: 'High-fidelity infrastructure for nationwide logistics.',
      price: 999,
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      features: ['Unlimited vehicles', 'Predictive intelligence', 'Sub-second sync', '24/7 dedicated support']
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise Mesh',
      desc: 'Custom infrastructure with sovereign data hosting.',
      price: 2499,
      icon: Building2,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      features: ['Global fleet mesh', 'SLA guaranteed', 'Custom integrations', 'ISO compliance toolkit']
    }
  ];

  const handleUpdatePlan = async (planId: any) => {
    if (!currentTenant?.id) return;
    setIsUpdating(true);
    try {
      // Call actual API
      const updated = await api.updateTenant(currentTenant.id, { 
        plan: planId,
        tier: planId as any
      });
      
      updateTenant({ plan: planId });
      addNotification(`Cluster upgraded to ${planId} successfully. Your infrastructure is being re-provisioned.`, "success");
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Plan update failed:', error);
      addNotification("Plan update failed. Please contact your finance administrator.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <RoleGuard permissions={['billing:view']} showFullPageError>
      <Layout 
        title="Fleet Finance & Plan" 
        subtitle="Manage your ecosystem tier, module costs, and billing cycles"
      >
        <div className="space-y-12 pb-24">
          {/* Active Plan Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-[10s]">
                   <TrendingUp size={300} />
                </div>
                <div className="relative z-10 space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-brand-accent text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                         <Zap size={32} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic">{activePlan} Cluster</h3>
                         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1 italic">Enterprise Operational Hub</p>
                      </div>
                   </div>
                   <p className="text-xl font-medium text-white/70 max-w-xl leading-relaxed">
                      You are currently operating on {activePlan === 'ENTERPRISE' ? 'our most high-fidelity infrastructure' : 'a high-performance node'} with sub-second latency and guaranteed 99.99% uptime for all dispatch nodes.
                   </p>
                   <div className="flex flex-wrap gap-4">
                      {[
                        { label: 'Sync Rate', val: activePlan === 'ENTERPRISE' ? 'Sub-second' : 'Real-time' },
                        { label: 'Active Modules', val: installedModules.length },
                        { label: 'Next Refresh', val: 'May 1st, 2026' }
                      ].map((stat, i) => (
                        <div key={i} className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1">
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
                           <span className="text-lg font-black text-brand-accent leading-none">{stat.val}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="relative z-10 pt-12 flex flex-col sm:flex-row gap-4">
                   <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-10 py-5 bg-brand-accent text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                   >
                      Manage Plan Tier <ArrowRight size={16} />
                   </button>
                   <button className="px-10 py-5 bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
                      View Platform Analytics
                   </button>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl flex flex-col justify-between">
                <div>
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 border-l-4 border-brand pl-4">Cost breakdown</h4>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center group">
                         <div>
                            <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1 group-hover:text-brand transition-colors">Core Platform</p>
                            <p className="text-[10px] font-bold text-slate-400 capitalize">{activePlan.toLowerCase()} Tier</p>
                         </div>
                         <p className="text-sm font-black text-slate-900">${monthlyCost}</p>
                      </div>
                      <div className="flex justify-between items-center group">
                         <div>
                            <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1 group-hover:text-brand transition-colors">Active Add-ons</p>
                            <p className="text-[10px] font-bold text-slate-400 capitalize">{installedModules.length} Modules Active</p>
                         </div>
                         <p className="text-sm font-black text-slate-900 text-right">+${installedModules.length * 49}</p>
                      </div>
                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Total / mo</p>
                            <p className="text-3xl font-black text-brand leading-none mt-1">${monthlyCost + (installedModules.length * 49)}</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="pt-8">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Next billing auto-process 2026-05-01</p>
                </div>
             </div>
          </div>

          <AnimatePresence>
            {showUpgradeModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-12">
                    <div className="flex items-center justify-between mb-12">
                      <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter italic">Upgrade Operational Hub</h2>
                        <p className="text-sm font-medium text-slate-500 mt-2">Select a cluster tier that matches your current mission requirements.</p>
                      </div>
                      <button 
                        onClick={() => setShowUpgradeModal(false)}
                        className="h-14 w-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {plans.map((p) => (
                        <div 
                          key={p.id}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between ${
                            activePlan === p.id 
                              ? 'border-brand bg-brand/5 shadow-xl ring-4 ring-brand/10 scale-105 z-10' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <div className={`h-12 w-12 ${p.bgColor} ${p.color} rounded-xl flex items-center justify-center mb-6`}>
                              <p.icon size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">{p.name}</h3>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed min-h-[40px]">{p.desc}</p>
                            <div className="mt-6 flex items-baseline gap-1">
                              <span className="text-3xl font-black">${p.price}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">/mo</span>
                            </div>
                            <div className="mt-8 space-y-4">
                              {p.features.map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <CheckCircle2 size={14} className="text-brand" />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button 
                            disabled={activePlan === p.id || isUpdating}
                            onClick={() => handleUpdatePlan(p.id)}
                            className={`w-full mt-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              activePlan === p.id 
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'bg-brand text-white shadow-xl shadow-brand/20 hover:bg-brand-dark active:scale-95'
                            } flex items-center justify-center gap-2`}
                          >
                            {isUpdating ? <TrendingUp size={16} className="animate-pulse" /> : null}
                            {activePlan === p.id ? 'Active Plan' : 'Transition to Cluster'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent">
                          <ShieldCheck size={32} />
                        </div>
                        <div>
                          <p className="font-bold text-lg leading-none">Need a custom node configuration?</p>
                          <p className="text-white/50 text-sm mt-1">Our infrastructure engineers can provision bespoke clusters for air & sea fleet mesh.</p>
                        </div>
                      </div>
                      <button className="px-10 py-4 bg-brand-accent text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                        Inquire Custom Node
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Billing & Activity Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <section className="space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <CreditCard size={24} className="text-brand" /> Payment Instruments
                   </h3>
                   <button className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">Manage Methods</button>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between overflow-hidden relative">
                   <div className="absolute top-0 left-0 h-1.5 w-full bg-brand" />
                   <div className="flex items-center gap-6">
                      <div className="h-12 w-20 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold italic tracking-tighter">
                         VISA
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 leading-none">Corporate Visa Index-0332</p>
                         <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Expires 09/28 • Default Terminal</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase text-emerald-500">Verified</span>
                   </div>
                </div>
             </section>

             <section className="space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <HistoryIcon size={24} className="text-brand" /> Billing History
                   </h3>
                   <button className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">Get Tax Ledger</button>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                   {[1, 2, 3].map((bill, i) => (
                      <div key={i} className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-all ${i !== 2 ? 'border-b border-slate-100' : ''}`}>
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                               <Calendar size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase">April 2026 Invoice</p>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">INV-2026-04-9982</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <p className="text-sm font-black text-slate-900">$744.00</p>
                            <button className="p-2 text-slate-400 hover:text-brand transition-all">
                               <Download size={18} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          </div>

          {/* Module Cost Table */}
          <section className="space-y-8">
             <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Package size={24} className="text-brand" /> Provisioned Infrastructure Units
             </h3>
             <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-900 text-white">
                         <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Module Identity</th>
                         <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">License Type</th>
                         <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Data Concurrency</th>
                         <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Unit Price</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {installedModules.map((m) => (
                         <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                                     {m.moduleId.substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-tight text-slate-900">{m.moduleId.replace(/-/g, ' ')}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Annual Cluster License</span>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-[10px] font-black text-brand uppercase tracking-widest px-2 py-1 bg-brand/5 rounded">High (10k TPS)</span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-900">$49.00</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </section>

          {/* Compliance & Safety Banner */}
          <div className="p-10 bg-brand/5 border border-brand/10 rounded-[3rem] flex items-center gap-10">
             <div className="h-20 w-20 shrink-0 bg-white rounded-[2rem] flex items-center justify-center text-brand shadow-xl">
                <ShieldCheck size={40} />
             </div>
             <div className="space-y-2">
                <h4 className="text-xl font-black uppercase tracking-tighter">Enterprise Billing Security</h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                   All financial transactions are governed by ISO 27001 protocols. Your primary payment instrument is isolated behind a hardware security module (HSM) and is never processed on our core ops containers.
                </p>
             </div>
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
};

export default SubscriptionView;
