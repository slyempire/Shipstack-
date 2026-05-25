
import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Check, Zap, ShieldCheck, Truck, ChevronLeft } from 'lucide-react';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Pilot',
      price: 'Early Access',
      desc: 'For founding partners helping shape the product.',
      features: ['Full platform access', 'Co-development support', 'Custom ERP integration', 'White-glove onboarding', 'Priority support', 'Weekly progress reviews'],
      cta: 'Apply for pilot',
      highlight: false
    },
    {
      name: 'Growth',
      price: '199',
      desc: 'For growing teams running 20+ vehicles.',
      features: ['Unlimited shipments', 'Live telemetry', 'M-Pesa & Flutterwave payouts', 'Up to 20 dispatchers', 'Fraud detection', 'Smart route optimization', 'Onboarding training'],
      cta: 'Sign up',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'For national networks and multi-country operators.',
      features: ['Multi-country sync', 'On-premise deployment', 'Unlimited users', '99.99% uptime SLA', 'Custom compliance rules', 'Dedicated engineer access'],
      cta: 'Talk to sales',
      highlight: false
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero (v2: dark + full-bleed port photo + bottom-left headline) */}
      <header className="relative bg-[#0B0E16] overflow-hidden h-[60vh] min-h-[500px] flex flex-col">
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=2600"
          alt="Cargo port"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-[#0B0E16]/70 to-[#0B0E16]/20" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0B0E16]/80 to-transparent" />

        <div className="relative flex-1 max-w-7xl mx-auto px-8 md:px-16 lg:px-24 w-full flex flex-col justify-between pt-32 pb-16">
          <div className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Pricing</span>
          </div>

          <div className="max-w-3xl lg:ml-12 xl:ml-20">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95] mb-8 uppercase">
              Simple <br />
              <span className="text-[#FF5722]">pricing.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl mb-4">
              Pick the plan that fits your team. All plans include a 14-day free trial.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF5722]">
              Pay via M-Pesa, card, or invoice &bull; No setup fees
            </p>
          </div>
        </div>
      </header>

      <section className="px-8 pt-24 pb-32 max-w-[90rem] mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-[3rem] p-10 flex flex-col h-full text-left relative overflow-hidden transition-all hover:scale-[1.02] border border-slate-100 ${plan.highlight ? 'shadow-2xl shadow-brand/10 ring-2 ring-brand' : 'shadow-sm'}`}>
              {plan.highlight && (
                <div className="absolute top-8 right-8 bg-brand text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                   Most popular
                </div>
              )}
              <div className="mb-10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-brand">{plan.name}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{plan.desc}</p>
              </div>
              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{plan.price === 'Custom' || plan.price === 'Free' ? '' : '$'}{plan.price}</span>
                {plan.price !== 'Custom' && plan.price !== 'Free' && <span className="text-sm font-bold text-slate-500 uppercase">/ month</span>}
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Check size={18} className="text-emerald shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${plan.highlight ? 'bg-brand text-white shadow-xl shadow-brand/20 active:scale-95' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 active:scale-95'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Motif */}
      <section className="px-8 py-48 bg-slate-900 text-white relative overflow-hidden border-y border-white/5">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=2600" 
            alt="Enterprise Logistics" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/30" />
        </div>
        <Zap className="absolute -right-20 -bottom-20 text-white/5" size={400} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
           <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
              <ShieldCheck size={32} />
           </div>
           <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">Need something custom?</h2>
           <p className="text-lg text-white/60 mb-12 font-medium leading-relaxed">
             Running 1,000+ hubs or a national fleet? Our team can build a custom deployment to match.
           </p>
           <button className="bg-white text-brand px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
             Talk to enterprise
           </button>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default PricingPage;
