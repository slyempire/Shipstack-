
import React from 'react';
import Layout from '../../components/Layout';
import { useTenantStore } from '../../store';
import { 
  CreditCard, 
  CheckCircle, 
  Zap, 
  Shield, 
  Globe, 
  Users, 
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

const SubscriptionView: React.FC = () => {
  const { currentTenant } = useTenantStore();

  const plans = [
    {
      name: 'BASIC',
      price: '$49',
      features: ['Up to 5 Vehicles', 'Basic Telemetry', 'Standard Support', 'Email Notifications'],
      color: 'bg-slate-100',
      textColor: 'text-slate-600',
      icon: Zap
    },
    {
      name: 'PRO',
      price: '$199',
      features: ['Up to 50 Vehicles', 'Real-time Telemetry', 'Priority Support', 'SMS & Push Notifications', 'Advanced Analytics'],
      color: 'bg-brand-accent/10',
      textColor: 'text-brand-accent',
      icon: Shield,
      isCurrent: currentTenant?.plan === 'PRO'
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      features: ['Unlimited Vehicles', 'Full API Access', 'Dedicated Account Manager', 'Custom Integrations', 'White-labeling'],
      color: 'bg-brand/10',
      textColor: 'text-brand',
      icon: Globe,
      isCurrent: currentTenant?.plan === 'ENTERPRISE'
    }
  ];

  return (
    <Layout title="Subscription & Billing">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Current Plan Header */}
        <div className="bg-brand rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[length:40px_40px]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Active Subscription</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
                {currentTenant?.name || 'Your Organization'}
              </h2>
              <p className="text-white/60 font-medium uppercase text-xs tracking-widest">
                Current Plan: <span className="text-white font-black">{currentTenant?.plan || 'PRO'}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                <Users size={24} className="mx-auto mb-2 text-brand-accent" />
                <div className="text-2xl font-black">24/50</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Vehicles Active</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                <BarChart3 size={24} className="mx-auto mb-2 text-emerald-400" />
                <div className="text-2xl font-black">98.2%</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`p-8 rounded-[2rem] border-2 transition-all ${plan.isCurrent ? 'border-brand-accent bg-white shadow-2xl scale-105' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
            >
              <div className={`h-14 w-14 ${plan.color} ${plan.textColor} rounded-2xl flex items-center justify-center mb-6`}>
                <plan.icon size={28} />
              </div>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-3xl font-black">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/month</span>}
              </div>
              
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.isCurrent ? (
                <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                  Current Active Plan
                </div>
              ) : (
                <button className="w-full py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-accent transition-all flex items-center justify-center gap-2">
                  Upgrade Now <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Billing History */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3">
              <CreditCard className="text-brand-accent" /> Billing History
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-brand-accent hover:underline">Download All Invoices</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Invoice #INV-2025-00{i}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Feb {21-i}, 2025 &bull; Paid via Visa **** 4242</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-black text-slate-900">$199.00</span>
                  <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand transition-all">
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionView;
