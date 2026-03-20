
import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Check, Zap, ShieldCheck, Truck, ChevronLeft } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '49',
      desc: 'Perfect for small regional transporters getting off spreadsheets.',
      features: ['Up to 5 Vehicles', 'Real-time GPS Tracking', 'Standard Manifests', 'Digital Signatures', 'Email Support'],
      cta: 'Start Free Trial',
      highlight: false
    },
    {
      name: 'Professional',
      price: '199',
      desc: 'The operating core for growing logistics and hub operations.',
      features: ['Up to 25 Vehicles', 'Smart Route Dispatching', 'Custom Rates & Billing', 'Multiple Hub Access', 'Priority Support', 'Full Document Vault'],
      cta: 'Deploy Pro Stack',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'Built for national fleets requiring audit-grade security and scale.',
      features: ['Unlimited Fleet Assets', 'Custom ERP Integrations', 'Dedicated Account Manager', 'On-Prem Deployment Option', 'SLA Guarantees', 'Advanced Analytics'],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
            <Layers size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase font-display">Shipstack</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/infrastructure" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">Infrastructure</Link>
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand flex items-center gap-2">
             <ChevronLeft size={16} /> Return to Base
          </Link>
        </div>
      </nav>

      <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center relative">
        <div className="absolute inset-0 -z-10 opacity-[0.15] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=2000" 
            alt="Financial Data" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase mb-6 leading-none">Simple, Reliable <span className="text-brand-accent">Pricing.</span></h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-20 font-medium">
          Choose the stack that fits your operational scale. All plans include a 14-day mission-critical trial.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-[3rem] p-10 flex flex-col h-full text-left relative overflow-hidden transition-all hover:scale-[1.02] ${plan.highlight ? 'border-4 border-brand-accent shadow-2xl shadow-brand-accent/10' : 'border border-slate-200'}`}>
              {plan.highlight && (
                <div className="absolute top-8 right-8 bg-brand-accent text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                   Popular Choice
                </div>
              )}
              <div className="mb-10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-brand">{plan.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{plan.desc}</p>
              </div>
              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{plan.price === 'Custom' ? '' : '$'}{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-sm font-bold text-slate-400 uppercase">/ month</span>}
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check size={18} className="text-emerald-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${plan.highlight ? 'bg-brand text-white shadow-xl shadow-brand/20 active:scale-95' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Motif */}
      <section className="px-8 py-32 bg-brand text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.2] pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=2000" 
            alt="Enterprise Logistics" 
            className="w-full h-full object-cover mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
        </div>
        <Zap className="absolute -right-20 -bottom-20 text-white/5" size={400} />
        <div className="max-w-3xl mx-auto text-center">
           <div className="h-16 w-16 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ShieldCheck size={32} />
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Built for Industrial Scale.</h2>
           <p className="text-lg text-white/40 mb-12 font-medium leading-relaxed">
             Need a custom deployment across 1,000+ hubs? Our enterprise architects can manifest a custom grid solution for your national fleet.
           </p>
           <button className="bg-white text-brand px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
             Contact Enterprise Support
           </button>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
