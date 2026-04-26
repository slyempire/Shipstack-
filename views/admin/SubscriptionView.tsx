
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useTenantStore, useModuleStore, useAppStore, useAuditStore } from '../../store';
import { api } from '../../api';
import { PLAN_PRICING, PLAN_MODULES, PLAN_HIERARCHY, AVAILABLE_MODULES } from '../../constants';
import { MARKETPLACE_MODULES } from '../../constants/modules';
import { ModuleId } from '../../types';
import {
  CreditCard, Zap, ShieldCheck, ArrowRight, CheckCircle2,
  Calendar, Download, AlertTriangle, Package, X, ArrowUpRight,
  ChevronDown, Layers, Boxes, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';

type PlanKey = 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  STARTER:    ['Dispatch & delivery notes', 'Warehouse inventory', 'Up to 200 deliveries/mo', 'Email support', '1 team seat'],
  GROWTH:     ['Everything in Starter', 'Orders & client portal', 'Driver app access', 'Fleet & finance modules', '1,000 deliveries/mo', '5 team seats', 'Priority support'],
  SCALE:      ['Everything in Growth', 'Facility portal', 'Analytics & reporting', 'ERP / API integrations', '5,000 deliveries/mo', '25 team seats', 'SLA guarantee (99.9%)'],
  ENTERPRISE: ['Everything in Scale', 'Unlimited deliveries', 'Dedicated account manager', 'Custom SLA (99.99%)', 'Unlimited seats', 'On-prem deployment option', 'Custom contract'],
};

const PLAN_COLORS: Record<PlanKey, { bg: string; ring: string; badge: string; text: string }> = {
  STARTER:    { bg: 'bg-slate-50',    ring: 'ring-slate-200',  badge: 'bg-slate-100 text-slate-600',    text: 'text-slate-900' },
  GROWTH:     { bg: 'bg-blue-50',     ring: 'ring-blue-200',   badge: 'bg-blue-100 text-blue-700',      text: 'text-blue-900' },
  SCALE:      { bg: 'bg-brand/5',     ring: 'ring-brand/30',   badge: 'bg-brand/10 text-brand',         text: 'text-brand' },
  ENTERPRISE: { bg: 'bg-slate-900',   ring: 'ring-slate-700',  badge: 'bg-white/10 text-white',         text: 'text-white' },
};

interface ConfirmModal {
  type: 'upgrade' | 'downgrade';
  targetPlan: PlanKey;
  modulesAffected: ModuleId[];
}

const SubscriptionView: React.FC = () => {
  const { currentTenant, updateTenant } = useTenantStore();
  const { installedModules } = useModuleStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activePlan = ((currentTenant?.plan as string)?.toUpperCase() || 'STARTER') as PlanKey;
  const activePricing = PLAN_PRICING[activePlan];
  const installedMarketplace = installedModules.filter(m => MARKETPLACE_MODULES.some(mp => mp.id === m.moduleId));
  const marketplaceCost = installedMarketplace.reduce((sum, m) => {
    const def = MARKETPLACE_MODULES.find(mp => mp.id === m.moduleId);
    return sum + (def?.pricing.amount ?? 0);
  }, 0);
  const totalMonthly = (activePricing?.monthlyUSD ?? 0) + marketplaceCost;

  const planOrder: PlanKey[] = ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'];

  const getModulesLostOnDowngrade = (targetPlan: PlanKey): ModuleId[] => {
    const currentModules = PLAN_MODULES[activePlan] ?? [];
    const targetModules = PLAN_MODULES[targetPlan] ?? [];
    return currentModules.filter(m => !targetModules.includes(m));
  };

  const getModulesGainedOnUpgrade = (targetPlan: PlanKey): ModuleId[] => {
    const currentModules = PLAN_MODULES[activePlan] ?? [];
    const targetModules = PLAN_MODULES[targetPlan] ?? [];
    return targetModules.filter(m => !currentModules.includes(m));
  };

  const openUpgrade = (target: PlanKey) => {
    const gained = getModulesGainedOnUpgrade(target);
    setConfirmModal({ type: 'upgrade', targetPlan: target, modulesAffected: gained });
  };

  const openDowngrade = (target: PlanKey) => {
    const lost = getModulesLostOnDowngrade(target);
    setConfirmModal({ type: 'downgrade', targetPlan: target, modulesAffected: lost });
  };

  const handleConfirm = async () => {
    if (!confirmModal || !currentTenant) return;
    setIsProcessing(true);
    try {
      if (confirmModal.type === 'upgrade') {
        const updated = await api.upgradeSubscription(currentTenant.id, confirmModal.targetPlan);
        updateTenant(updated);
        addNotification(`Plan upgraded to ${PLAN_PRICING[confirmModal.targetPlan].label}. New modules are now active.`, 'success');
      } else {
        const { tenant } = await api.downgradeSubscription(currentTenant.id, confirmModal.targetPlan);
        updateTenant(tenant);
        addNotification(`Plan downgraded to ${PLAN_PRICING[confirmModal.targetPlan].label}. Changes take effect on next billing date.`, 'info');
      }
    } catch (err: any) {
      addNotification(err.message || 'Plan change failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleDownloadInvoice = (month: string, amount: string) => {
    const lines = [
      'SHIPSTACK INVOICE', '',
      `Period: ${month}`, `Amount: ${amount}`,
      `Plan: ${activePlan}`, `Tenant: ${currentTenant?.name ?? 'Your Organization'}`,
      `Generated: ${new Date().toISOString()}`, '',
      'Thank you for using Shipstack.'
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipstack-invoice-${month.toLowerCase().replace(/\s/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard permissions={['billing:view']} showFullPageError>
      <Layout title="Subscription & Billing" subtitle="Manage your plan, modules, and payment details">
        <div className="space-y-12 pb-24">

          {/* ── Current Plan Banner ── */}
          <div className={`rounded-[3rem] p-10 relative overflow-hidden ${activePlan === 'ENTERPRISE' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 shadow-xl'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-brand text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                  <Zap size={32} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${activePlan === 'ENTERPRISE' ? 'text-white/40' : 'text-slate-400'}`}>Active Plan</p>
                  <h3 className={`text-3xl font-black uppercase tracking-tighter leading-none ${activePlan === 'ENTERPRISE' ? 'text-white' : 'text-slate-900'}`}>
                    {activePricing.label}
                  </h3>
                  <p className={`text-sm font-medium mt-1 ${activePlan === 'ENTERPRISE' ? 'text-white/60' : 'text-slate-500'}`}>{activePricing.tagline}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${activePlan === 'ENTERPRISE' ? 'text-white/40' : 'text-slate-400'}`}>Estimated monthly</p>
                <p className={`text-4xl font-black leading-none ${activePlan === 'ENTERPRISE' ? 'text-brand-accent' : 'text-brand'}`}>
                  ${totalMonthly}<span className="text-base font-medium opacity-60">/mo</span>
                </p>
                <p className={`text-[10px] font-medium ${activePlan === 'ENTERPRISE' ? 'text-white/40' : 'text-slate-400'}`}>
                  ${activePricing.monthlyUSD} base + ${marketplaceCost} add-ons
                </p>
              </div>
            </div>
          </div>

          {/* ── Plan Comparison Table ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter">Change Plan</h3>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${PLAN_COLORS[activePlan].badge}`}>
                {activePricing.label} Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {planOrder.map((plan) => {
                const pricing = PLAN_PRICING[plan];
                const colors = PLAN_COLORS[plan];
                const isActive = plan === activePlan;
                const currentLevel = PLAN_HIERARCHY[activePlan] ?? 0;
                const targetLevel = PLAN_HIERARCHY[plan] ?? 0;
                const isUpgrade = targetLevel > currentLevel;
                const isDowngrade = targetLevel < currentLevel;
                const gained = isUpgrade ? getModulesGainedOnUpgrade(plan) : [];
                const lost = isDowngrade ? getModulesLostOnDowngrade(plan) : [];

                return (
                  <motion.div
                    key={plan}
                    whileHover={!isActive ? { y: -4 } : {}}
                    className={`rounded-[2.5rem] p-8 flex flex-col ring-2 transition-all relative overflow-hidden ${colors.bg} ${isActive ? colors.ring : 'ring-transparent hover:ring-slate-200'}`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                        Current
                      </div>
                    )}
                    {plan === 'SCALE' && !isActive && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-brand text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                        Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h4 className={`text-lg font-black uppercase tracking-tight ${plan === 'ENTERPRISE' ? 'text-white' : 'text-slate-900'}`}>{pricing.label}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${plan === 'ENTERPRISE' ? 'text-white/50' : 'text-slate-400'}`}>{pricing.tagline}</p>
                    </div>

                    <div className="mb-6">
                      <span className={`text-3xl font-black ${plan === 'ENTERPRISE' ? 'text-brand-accent' : 'text-slate-900'}`}>
                        {plan === 'ENTERPRISE' ? 'Custom' : `$${pricing.monthlyUSD}`}
                      </span>
                      {plan !== 'ENTERPRISE' && <span className="text-sm text-slate-400">/mo</span>}
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-8">
                      {PLAN_FEATURES[plan].map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className={`shrink-0 mt-0.5 ${plan === 'ENTERPRISE' ? 'text-brand-accent' : 'text-emerald-500'}`} />
                          <span className={`text-[11px] font-medium ${plan === 'ENTERPRISE' ? 'text-white/70' : 'text-slate-600'}`}>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <button
                        onClick={() => navigate('/admin/marketplace')}
                        className="w-full py-3.5 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                      >
                        <Boxes size={13} /> Browse Add-ons
                      </button>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => openUpgrade(plan)}
                        className="w-full py-3.5 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent transition-all shadow-lg shadow-brand/20"
                      >
                        <ArrowUpRight size={13} />
                        Upgrade — {gained.length} module{gained.length !== 1 ? 's' : ''} added
                      </button>
                    ) : (
                      <button
                        onClick={() => openDowngrade(plan)}
                        className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        <TrendingDown size={13} />
                        Downgrade — {lost.length} module{lost.length !== 1 ? 's' : ''} removed
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ── Installed Modules + Costs ── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Package size={24} className="text-brand" /> Active Add-ons
              </h3>
              <button
                onClick={() => navigate('/admin/marketplace')}
                className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline flex items-center gap-1"
              >
                Browse Marketplace <ArrowRight size={12} />
              </button>
            </div>

            {installedMarketplace.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
                <Boxes size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-tight mb-2">No marketplace add-ons installed</p>
                <p className="text-xs text-slate-400 font-medium mb-6">Extend your platform with industry kits, AI tools, and integrations.</p>
                <button
                  onClick={() => navigate('/admin/marketplace')}
                  className="px-8 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-accent transition-all"
                >
                  Open Marketplace
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Module</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Installed</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Monthly</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {installedMarketplace.map((m) => {
                      const def = MARKETPLACE_MODULES.find(mp => mp.id === m.moduleId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-5">
                            <p className="text-xs font-black uppercase tracking-tight text-slate-900">{def?.name ?? m.moduleId}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By {def?.publisher.name ?? 'Shipstack'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                              {(def?.category ?? '').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {m.installedAt ? new Date(m.installedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">
                            {def?.pricing.model === 'free' ? 'Free' : `$${def?.pricing.amount ?? 0}/mo`}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-8 py-4 text-xs font-black text-slate-600 uppercase tracking-widest">Add-ons Subtotal</td>
                      <td className="px-8 py-4 text-right font-black text-slate-900">${marketplaceCost}/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Billing History ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <CreditCard size={24} className="text-brand" /> Payment Method
                </h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-brand" />
                <div className="flex items-center gap-5">
                  <div className="h-12 w-20 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold italic tracking-tighter">VISA</div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none">Corporate Visa ···0332</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Expires 09/28 · Default</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-emerald-500">Verified</span>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Calendar size={24} className="text-brand" /> Billing History
                </h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                {[
                  { month: 'April 2026', inv: 'INV-2026-04-9982', amount: `$${totalMonthly}.00` },
                  { month: 'March 2026', inv: 'INV-2026-03-8871', amount: `$${totalMonthly}.00` },
                  { month: 'February 2026', inv: 'INV-2026-02-7760', amount: `$${activePricing.monthlyUSD}.00` },
                ].map((bill, i, arr) => (
                  <div key={i} className={`p-6 flex items-center justify-between hover:bg-slate-50 transition-all ${i !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{bill.month}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{bill.inv}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <p className="text-sm font-black text-slate-900">{bill.amount}</p>
                      <button
                        onClick={() => handleDownloadInvoice(bill.month, bill.amount)}
                        className="p-2 text-slate-400 hover:text-brand transition-all"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Trust Banner ── */}
          <div className="p-10 bg-brand/5 border border-brand/10 rounded-[3rem] flex items-center gap-8">
            <div className="h-16 w-16 shrink-0 bg-white rounded-[1.5rem] flex items-center justify-center text-brand shadow-xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-tighter mb-1">Billing Security</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                All transactions are processed via PCI-DSS Level 1 infrastructure. Your payment instrument is never stored on Shipstack servers.
                Downgrades take effect at the end of the current billing period.
              </p>
            </div>
          </div>

        </div>
      </Layout>

      {/* ── Confirm Modal ── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className={`p-8 ${confirmModal.type === 'upgrade' ? 'bg-brand' : 'bg-amber-500'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {confirmModal.type === 'upgrade'
                      ? <ArrowUpRight size={22} className="text-white" />
                      : <TrendingDown size={22} className="text-white" />
                    }
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                      {confirmModal.type === 'upgrade' ? 'Confirm Upgrade' : 'Confirm Downgrade'}
                    </h3>
                  </div>
                  <button onClick={() => setConfirmModal(null)} className="text-white/60 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Switching from</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{PLAN_PRICING[activePlan].label}</p>
                    <p className="text-[10px] text-slate-400">${PLAN_PRICING[activePlan].monthlyUSD}/mo</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Switching to</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{PLAN_PRICING[confirmModal.targetPlan].label}</p>
                    <p className="text-[10px] text-slate-400">${PLAN_PRICING[confirmModal.targetPlan].monthlyUSD}/mo</p>
                  </div>
                </div>

                {confirmModal.modulesAffected.length > 0 && (
                  <div className={`p-5 rounded-2xl ${confirmModal.type === 'upgrade' ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${confirmModal.type === 'upgrade' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {confirmModal.type === 'upgrade' ? `${confirmModal.modulesAffected.length} modules unlocked` : `${confirmModal.modulesAffected.length} modules removed`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {confirmModal.modulesAffected.map(m => (
                        <span key={m} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${confirmModal.type === 'upgrade' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {m.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {confirmModal.type === 'downgrade' && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                      Downgrade takes effect at end of billing period. Your marketplace add-ons will remain active separately.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 ${confirmModal.type === 'upgrade' ? 'bg-brand hover:bg-brand-accent' : 'bg-amber-500 hover:bg-amber-600'}`}
                  >
                    {isProcessing ? 'Processing...' : `Confirm ${confirmModal.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RoleGuard>
  );
};

export default SubscriptionView;
