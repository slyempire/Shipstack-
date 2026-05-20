
import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Check, Zap, ShieldCheck, Truck, ChevronLeft } from 'lucide-react';
import MarketingLayout from '../../components/marketing/MarketingLayout';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Pilot',
      price: 'Early Access',
      desc: 'For industry partners helping us build the future.',
      features: ['Full platform access', 'Co-development support', 'Custom ERP integration', 'White-glove onboarding', 'Priority support', 'Weekly progress reviews'],
      cta: 'Apply for Pilot',
      highlight: false
    },
    {
      name: 'Growth',
      price: '199',
      desc: 'Optimized for high-throughput logistics hubs.',
      features: ['Unlimited shipments', 'Advanced telemetry', 'M-Pesa/Flutterwave payouts', 'Up to 20 dispatchers', 'Fraud detection suite', 'AI: Route Intelligence', 'Dedicated training'],
      cta: 'Request Early Access',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'Continental architecture for national networks.',
      features: ['Multi-country/Region sync', 'On-premise deployment options', 'Unlimited enterprise users', '99.99% SLA Guarantee', 'Custom compliance engine', 'Direct engineer access'],
      cta: 'Book Consultation',
      highlight: false
    }
  ];

  return (
    <MarketingLayout>
      <section className="px-8 pt-32 pb-32 max-w-[90rem] mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=2600" 
            alt="Large Scale Port" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/70" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none text-slate-900">Simple, Reliable <br/><span className="text-brand">Pricing.</span></h1>
        <p className="text-xl md:text-2xl text-slate-500 max-w-4xl mx-auto mb-8 font-bold uppercase tracking-tight leading-tight">
          Choose the stack that fits your operational scale. <br className="hidden md:block" /> All plans include a mission-critical 14-day trial.
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-20">
          Pay via M-Pesa, card, or invoice • No setup fees
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-[3rem] p-10 flex flex-col h-full text-left relative overflow-hidden transition-all hover:scale-[1.02] border border-slate-100 ${plan.highlight ? 'shadow-2xl shadow-brand/10 ring-2 ring-brand' : 'shadow-sm'}`}>
              {plan.highlight && (
                <div className="absolute top-8 right-8 bg-brand text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                   Popular Choice
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
           <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">Built for Industrial Scale.</h2>
           <p className="text-lg text-white/60 mb-12 font-medium leading-relaxed">
             Need a custom deployment across 1,000+ hubs? Our enterprise architects can manifest a custom grid solution for your national fleet.
           </p>
           <button className="bg-white text-brand px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
             Contact Enterprise Support
           </button>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default PricingPage;
