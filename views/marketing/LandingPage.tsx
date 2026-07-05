import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { api } from '../../api';
import { 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  CheckCircle,
  Zap, 
  Globe,
  Layers,
  MapPin,
  Activity,
  Shield,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Twitter,
  Linkedin,
  Facebook,
  CreditCard,
  Building,
  FileText,
  User,
  Plus,
  X,
  Target,
  BarChart3,
  Smartphone,
  Bell,
  Users,
  Navigation,
  Wallet,
  LayoutDashboard,
  Search,
  Database,
  History,
  ClipboardCheck,
  MousePointer2,
  Cog
} from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion';

const TrustBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 }}
    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mt-8"
  >
    <Shield size={14} className="text-brand" />
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Early-access pilot partners: Now onboarding for Q3 2026</span>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
      className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 group hover:border-brand/30 transition-all shadow-xl"
    >
      <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-all">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-white">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
};

const StatItem = ({ value, label, icon: Icon }: any) => {
  const targetValue = parseFloat(value.toString().replace(/,/g, ''));
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let start = 0;
      const end = targetValue;
      const duration = 2000;
      const stepTime = 30;
      const step = end / (duration / stepTime);

      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [isInView, targetValue, hasAnimated]);

  const formattedValue = value.toString().includes('%') 
    ? `${displayValue.toFixed(1)}%` 
    : value.toString().includes('+') 
      ? `${Math.floor(displayValue).toLocaleString()}+`
      : Math.floor(displayValue).toLocaleString();

  return (
    <div ref={ref} className="flex flex-col items-center text-center p-8 bg-[#121E36] rounded-3xl border border-white/5 shadow-inner group hover:border-brand/20 transition-all">
      <Icon className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
      <span className="text-3xl font-black text-white mb-2">{formattedValue}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
};

const StepAction = ({ number, title, icon: Icon, desc, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ delay }}
      className="flex flex-col items-center text-center relative z-10"
    >
      <div className="h-20 w-20 bg-brand text-white rounded-full flex items-center justify-center mb-6 shadow-xl relative ring-8 ring-[#1A2B4D]">
        <Icon size={32} />
        <div className="absolute -top-2 -left-2 h-8 w-8 bg-white text-brand rounded-full flex items-center justify-center font-black text-sm border-2 border-brand">
          {number}
        </div>
      </div>
      <h4 className="text-lg font-black uppercase tracking-tight text-white mb-2">{title}</h4>
      <p className="text-xs text-slate-400 font-medium max-w-[200px]">{desc}</p>
    </motion.div>
  );
};

const TestimonialCard = ({ quote, author, role, company, city, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ delay }}
      className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col justify-between"
    >
      <div className="mb-8">
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(i => <span key={i} className="text-brand">★</span>)}
        </div>
        <p className="text-lg text-slate-700 italic font-medium leading-relaxed">"{quote}"</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-slate-100 rounded-full flex-shrink-0 border-2 border-slate-50" />
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{author}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role}, {company} — {city}</p>
        </div>
      </div>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 text-left hover:text-brand transition-colors"
      >
        <span className="text-lg font-black uppercase tracking-tight text-white">{question}</span>
        {isOpen ? <Plus className="text-brand rotate-45" size={20} /> : <Plus className="text-brand" size={20} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pb-6"
          >
            <p className="text-slate-400 font-medium leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PricingTier = ({ tier, price, desc, features, cta, featured, onClick }: any) => (
  <div className={`p-10 rounded-[3rem] border transition-all flex flex-col ${
    featured 
      ? 'bg-slate-900 border-t-8 border-brand shadow-2xl scale-105 z-10' 
      : 'bg-[#1A2B4D] border-white/5 hover:border-white/10'
  }`}>
    <div className="mb-8">
      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{tier}</h3>
      <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-6">{desc}</p>
      <div className="flex items-end gap-1">
        <span className="text-5xl font-black text-white">{price}</span>
        {price !== 'Custom' && <span className="text-slate-400 font-black uppercase text-[10px] mb-2">/mo</span>}
      </div>
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
          <CheckCircle size={16} className="text-brand shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={onClick}
      className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
      featured 
        ? 'bg-brand text-white shadow-xl shadow-brand/20 hover:scale-[1.02]' 
        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
    }`}>
      {cta}
    </button>
  </div>
);

const SectionWrapper = ({ children, className }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardRedirect = () => {
    const role = user?.role?.toUpperCase();
    if (role === 'DRIVER') navigate('/driver');
    else if (role === 'FACILITY' || role === 'FACILITY_OPERATOR') navigate('/facility');
    else if (role === 'WAREHOUSE') navigate('/admin/warehouse');
    else navigate('/admin');
  };

  return (
    <MarketingLayout>
      {/* Hero Section (v2: Arrow-inspired full-bleed photo + lower-left headline + stat bar below) */}
      <section className="relative bg-[#0B0E16] overflow-hidden">
        {/* Full-bleed photo with dark gradient overlay for headline legibility */}
        <div className="relative h-[85vh] min-h-[640px] md:min-h-[720px]">
          <img
            src="https://images.unsplash.com/photo-1549194388-f61be84a6e9e?q=80&w=2600&auto=format&fit=crop"
            alt="Logistics truck on highway"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Bottom-anchored gradient -- darker at the bottom so the headline reads cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-[#0B0E16]/70 to-[#0B0E16]/20" />
          {/* Subtle top gradient so the nav bar stays readable on lighter top of image */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0B0E16]/80 to-transparent" />

          {/* Hero content -- offset from left edge so it reads as part of a
              centered composition rather than flush-left. Inner padding scales
              with breakpoint: md:px-16, lg:px-32 pushes content inward toward
              the centerline, matching the Arrow ref proportions. */}
          <div className="relative h-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 flex flex-col justify-between pt-32 pb-16">
            {/* Top: pilot badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="self-start"
            >
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Now onboarding pilot partners</span>
              </div>
            </motion.div>

            {/* Bottom-left: headline + subhead + CTAs (inset further on lg+) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="max-w-3xl lg:ml-12 xl:ml-20"
            >
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tight leading-[0.95] text-white mb-8">
                Logistics, <br />
                built for <span className="text-brand">Africa.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed mb-10 max-w-2xl">
                One place to manage your fleet, dispatch drivers, and reconcile payments &mdash; built for African logistics teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
                  className="px-8 py-5 bg-brand hover:bg-brand-orange-dark text-white text-sm font-bold rounded-xl shadow-2xl shadow-brand/20 hover:shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Get started
                  <ArrowRight size={18} />
                </button>
                {!isAuthenticated && (
                  <button
                    onClick={() => navigate('/product')}
                    className="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-sm font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-3"
                  >
                    See how it works
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stat bar -- honest pilot-stage numbers, no inflated traction claims.
            Inner padding mirrors the hero so the stats line up under the
            headline rather than running flush to the screen edge. */}
        <div className="border-t border-white/5 bg-[#1A1F2E]">
          <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
              {[
                { value: 'Pilot', label: 'Live with first partners' },
                { value: '<25ms', label: 'API response' },
                { value: '99.99%', label: 'Uptime SLA' },
                { value: '24/7', label: 'Support during pilot' },
              ].map((stat) => (
                <div key={stat.label} className="py-10 px-6 md:px-10">
                  <p className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="container-responsive">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-16">Building with our first pilot partners &mdash; looking for the next.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-center gap-8 md:gap-16">
             <div className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60">
                <div className="h-12 w-full bg-slate-200 rounded-xl flex items-center justify-center px-4">
                   <span className="font-black text-slate-400 tracking-tighter text-lg uppercase italic">M-Pesa</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Payout Ready</span>
             </div>
             <div className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60">
                <div className="h-12 w-full bg-slate-200 rounded-xl flex items-center justify-center px-4">
                   <span className="font-black text-slate-400 tracking-tighter text-lg uppercase italic">ERP Sync</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Frappe Integration</span>
             </div>
             <div className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60">
                <div className="h-12 w-full bg-slate-200 rounded-xl flex items-center justify-center px-4">
                   <span className="font-black text-slate-400 tracking-tighter text-lg uppercase italic">Settlements</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Bank-grade</span>
             </div>
             <div className="flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60">
                <div className="h-12 w-full bg-slate-200 rounded-xl flex items-center justify-center px-4 text-center">
                   <Shield size={16} className="text-slate-400 mr-2" />
                   <span className="font-black text-slate-400 tracking-tighter text-lg uppercase">Security Tier</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Pilot-Verified</span>
             </div>
          </div>
          <div className="mt-16 text-center text-slate-400">
            <span className="inline-flex items-center gap-3 px-6 py-2 bg-slate-200/50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-300">
              Closed pilot &mdash; onboarding teams in East and West Africa
            </span>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <SectionWrapper className="py-48 bg-slate-50 relative overflow-hidden">
        {/* Subtle background image for impact */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
           <img 
             src="https://images.unsplash.com/photo-1549194388-f61be84a6e9e?q=80&w=2000&auto=format&fit=crop" 
             alt="Logistics Impact" 
             className="w-full h-full object-cover grayscale"
             referrerPolicy="no-referrer"
           />
        </div>

        <div className="container-responsive relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-32">
            <div className="max-w-3xl">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-tight">
                Built for<br />
                the real world.
              </h2>
              <p className="text-xl md:text-2xl text-slate-600 font-medium">Enterprise visibility, tuned for African logistics.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={LayoutDashboard}
              title="One dashboard"
              desc="See every carrier and vehicle from one screen. No more switching between five tools to find one truck."
              delay={0}
            />
            <FeatureCard
              icon={Wallet}
              title="Automated payouts"
              desc="Pay drivers and carriers automatically over M-Pesa, Wave, or bank transfer the moment a trip is reconciled."
              delay={0.1}
            />
            <FeatureCard
              icon={Navigation}
              title="Live tracking"
              desc="Street-level GPS for every vehicle, with route history, ETAs, and vehicle health all in one place."
              delay={0.2}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Comparison Section */}
      <SectionWrapper className="py-48 bg-[#0B0E16] border-y border-white/5 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img 
             src="https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=2600&auto=format&fit=crop" 
             alt="Logistics Efficiency" 
             className="w-full h-full object-cover grayscale"
             referrerPolicy="no-referrer"
          />
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container-responsive relative z-10">
          <div className="text-center mb-32">
            <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6">How we <span className="text-brand">compare.</span></h2>
            <p className="text-slate-400 font-medium">The honest answer, in one table.</p>
          </div>
          
          <div className="overflow-x-auto pb-12">
            <div className="min-w-[800px]">
               <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                   <tr>
                     <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Capability</th>
                     <th className="py-8 px-10">
                        <div className="bg-brand text-white px-6 py-4 rounded-xl inline-block text-xl font-black uppercase tracking-tight shadow-xl shadow-brand/20">Shipstack</div>
                     </th>
                     <th className="py-8 px-10 text-xl font-black uppercase tracking-tight text-slate-400">Legacy enterprise</th>
                     <th className="py-8 px-10 text-xl font-black uppercase tracking-tight text-slate-400">Spreadsheets</th>
                   </tr>
                 </thead>
                 <tbody className="text-white">
                   {[
                     { feature: "Response time", shipstack: "<250ms", trad: "2.5s - 5s", diy: "N/A" },
                     { feature: "Setup time", shipstack: "Same day", trad: "12-24 weeks", diy: "Ongoing" },
                     { feature: "Live tracking", shipstack: true, trad: "Hourly batch", diy: "Phone calls" },
                     { feature: "M-Pesa integration", shipstack: true, trad: "No", diy: "Manual cash" },
                     { feature: "Demand forecasting", shipstack: true, trad: "Paid add-on", diy: "No" },
                     { feature: "Uptime SLA", shipstack: "99.99%", trad: "99.0%", diy: "Best effort" }
                   ].map((row, i) => (
                     <tr key={i} className="group">
                       <td className="py-10 px-10 bg-white/5 rounded-l-3xl border-y border-l border-white/5 group-hover:bg-white/10 transition-colors font-bold text-slate-300">{row.feature}</td>
                       <td className="py-10 px-10 bg-white/5 border-y border-white/5 group-hover:bg-white/10 transition-colors font-black text-brand text-lg">
                         {typeof row.shipstack === 'boolean' ? (
                           row.shipstack ? <div className="flex items-center gap-2"><CheckCircle size={18} /><span>Included</span></div> : <X size={20} className="text-slate-600" />
                         ) : (
                           <div className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-brand shrink-0" />
                              {row.shipstack}
                           </div>
                         )}
                       </td>
                       <td className="py-10 px-10 bg-white/5 border-y border-white/5 group-hover:bg-white/10 transition-colors text-slate-500 font-medium italic">
                          {typeof row.trad === 'boolean' ? (
                           row.trad ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-600" />
                         ) : row.trad}
                       </td>
                       <td className="py-10 px-10 bg-white/5 rounded-r-3xl border-y border-r border-white/5 group-hover:bg-white/10 transition-colors text-slate-500 font-medium italic">
                          {typeof row.diy === 'boolean' ? (
                           row.diy ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-600" />
                         ) : row.diy}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Features section with background */}
      <SectionWrapper className="py-48 bg-[#0B0E16] relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
           <div className="absolute inset-0 bg-[#0B0E16]/90 z-10" />
           <img 
             src="https://images.unsplash.com/photo-1512413316925-fd47934313f1?q=80&w=2600&auto=format&fit=crop" 
             alt="African Logistics Port" 
             className="w-full h-full object-cover grayscale opacity-20 scale-105"
             referrerPolicy="no-referrer"
           />
        </div>
        <div className="container-responsive relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
             <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6">Product</p>
                <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8 leading-tight">Everything you need.</h2>
                <p className="text-xl text-slate-400 font-medium">The core tools your operations team uses every day.</p>
             </div>
             <div className="rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(255,140,66,0.1)] border border-white/5 relative group bg-slate-900 aspect-video flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-brand/5 opacity-50" />
                <div className="relative w-full h-full bg-slate-950 rounded-2xl border border-white/10 flex flex-col p-4 shadow-2xl">
                   {/* Mock UI elements */}
                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Live</span>
                      </div>
                      <div className="flex gap-1">
                         <div className="h-2 w-8 bg-brand/20 rounded-full" />
                         <div className="h-2 w-12 bg-white/5 rounded-full" />
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-3 flex-grow">
                      <div className="col-span-2 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-end gap-2 overflow-hidden relative">
                         <MapPin size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand opacity-20" />
                         <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                         <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                      </div>
                      <div className="flex flex-col gap-3">
                         <div className="h-1/2 bg-white/5 rounded-xl border border-white/5 p-2 flex items-center justify-center">
                            <Activity size={16} className="text-brand" />
                         </div>
                         <div className="h-1/2 bg-white/5 rounded-xl border border-white/5 p-2 flex items-center justify-center">
                            <Shield size={16} className="text-emerald-500" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-24 text-white">
            {[
              { title: "Smart routing", desc: "Routes that account for road conditions, safety, and traffic across African cities.", icon: Navigation },
              { title: "Vehicle telemetry", desc: "GPS, fuel, and health diagnostics from every vehicle, with full history.", icon: Database },
              { title: "Mobile payouts", desc: "Pay drivers and carriers instantly over M-Pesa, Wave, or bank transfer.", icon: Wallet },
              { title: "Dispatch dashboard", desc: "Plan trips, assign drivers, and watch them happen — live, in one place.", icon: LayoutDashboard },
              { title: "Multi-hub inventory", desc: "Track SKUs across warehouses and depots in real time.", icon: ClipboardCheck },
              { title: "Open API", desc: "Plug Shipstack into your existing SAP, Frappe, Odoo, or custom ERP.", icon: Cog }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-6 group">
                <div className="flex items-center justify-between">
                   <div className="h-14 w-14 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-sm border border-white/5">
                      <item.icon size={26} />
                   </div>
                   <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">0{i+1}</span>
                </div>
                <div className="space-y-4">
                   <h4 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-brand transition-colors">{item.title}</h4>
                   <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
                <div className="h-[2px] w-8 bg-brand/50 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Case Study Section */}
      <SectionWrapper className="py-32 bg-[#0B0E16]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">Built with <span className="text-brand">operators.</span></h2>
            <p className="text-slate-400 font-medium">Shaped on the ground with the operators piloting Shipstack today.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-10 mb-10">
             <div className="bg-white rounded-[3rem] p-12 overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4">Field research</p>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-6">Workflows shaped on the ground</h3>
                   <p className="text-slate-500 font-medium leading-relaxed mb-8">
                      We spent 6 months in Nairobi and Lagos with logistics teams &mdash; learning how they actually handle exceptions, settlements, and the day-to-day grind.
                   </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Truck size={120} />
                </div>
             </div>
             <div className="rounded-[3rem] overflow-hidden shadow-2xl relative aspect-square lg:aspect-auto">
                <img 
                   src="https://images.unsplash.com/photo-1558444479-c8f02791596f?q=80&w=2600&auto=format&fit=crop" 
                   alt="Logistics Dashboard" 
                   className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                   referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10 text-white">
                   <p className="text-4xl font-black uppercase tracking-tighter">Pilot live</p>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Running with first partners</p>
                </div>
             </div>
          </div>

          <div className="bg-[#121E36] rounded-[4rem] p-10 md:p-20 border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
              <Plus size={300} className="text-brand" />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Building className="text-brand" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">FastCourier</h3>
                    <p className="text-sm font-black text-brand uppercase tracking-widest">Nairobi, Kenya</p>
                  </div>
                </div>
                
                <div className="mb-12">
                  <MessageSquare className="text-brand mb-6 opacity-50" size={48} />
                  <p className="text-2xl md:text-3xl text-white font-medium italic leading-relaxed">
                    "Shipstack gave us complete operational visibility during our trial, helping us streamline driver settlements."
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-4 bg-brand/10 border border-brand/20 rounded-2xl">
                    <p className="text-3xl font-black text-white">250%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand">Revenue Growth</p>
                  </div>
                  <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-3xl font-black text-white">40%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cost Reduction</p>
                  </div>
                  <div className="px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-3xl font-black text-white">6 Month</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Timeline</p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-brand/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-navy rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden aspect-square flex flex-col justify-center items-center text-center">
                  <div className="h-32 w-32 bg-brand rounded-full mb-8 flex items-center justify-center text-white shadow-2xl relative">
                    <Truck size={64} />
                    <div className="absolute -right-2 -bottom-2 h-12 w-12 bg-white rounded-full flex items-center justify-center text-brand">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <h4 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">500+</h4>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Daily deliveries</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* How It Works Section */}
      <SectionWrapper className="py-48 bg-white border-t border-slate-100 relative overflow-hidden">
        <div className="container-responsive relative z-10">
          <div className="mb-32">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-tight">How it works.</h2>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <StepAction number="1" icon={User} title="Sign up" desc="Create your account in under a minute." delay={0.1} />
              <StepAction number="2" icon={Truck} title="Set up" desc="Add your vehicles, drivers, and routes." delay={0.2} />
              <StepAction number="3" icon={MapPin} title="Track" desc="See where every vehicle is, in real time." delay={0.3} />
              <StepAction number="4" icon={TrendingUp} title="Grow" desc="Spot trends and grow with data-driven insights." delay={0.4} />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Testimonials section (v2: image 9 dark grid -- 4 cards on #0B0E16) */}
      <SectionWrapper className="py-32 bg-[#0B0E16]">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
          <div className="mb-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-4">Pilot feedback</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 uppercase max-w-3xl leading-[0.95]">
              Your trust, our journey &mdash; <span className="text-brand">delivering excellence</span> together.
            </h2>
            <p className="text-white/50 font-medium text-base max-w-xl">Early notes from operators piloting Shipstack with us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { quote: "Finally a platform that doesn't ignore the complexity of the African last mile. The visibility into driver settlements is exactly what we needed.", author: "Amara Diallo", role: "Operations Director, SwiftRoute Logistics", initial: "A" },
              { quote: "Shipstack's integration with our existing ERP was seamless. It's the first logistics OS that feels built for scale, not just hype.", author: "Moussa Keïta", role: "CTO, Sahel Freight", initial: "M" },
              { quote: "The early-access support has been incredible. They aren't just selling software — they're helping us refine our entire operational flow.", author: "Kwame Mensah", role: "Founder, Nexus Courier", initial: "K" },
              { quote: "Live tracking changed how we run dispatch. We can see every trip and respond before customers even call to ask.", author: "Naledi Khumalo", role: "Fleet Manager, Cape Cargo Co", initial: "N" },
            ].map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-[#1A1F2E] border border-white/5 rounded-3xl p-8 flex flex-col h-full hover:border-brand/30 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-black text-lg mb-6">
                  {t.initial}
                </div>
                <p className="text-white/80 text-sm leading-relaxed font-medium flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-white font-bold text-sm mb-1">{t.author}</p>
                  <p className="text-white/40 text-xs font-medium">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Payment Methods Section */}
      <SectionWrapper className="py-48 bg-[#0B0E16] border-y border-white/5 overflow-hidden">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6">Payments</p>
              <h2 className="text-5xl md:text-[6rem] font-black tracking-tight text-white mb-10 leading-tight">
                Get paid <br />
                <span className="text-brand">faster.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed mb-16 max-w-xl">
                Pay drivers and carriers the moment a trip is reconciled. We handle the multi-region currency mess for you.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex flex-col gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-brand/20 transition-all">
                  <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                    <Activity size={24} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Mobile money</h4>
                  <p className="text-xs text-slate-500 font-medium">Direct M-Pesa, Wave, and MTN payouts across East and West Africa.</p>
                </div>
                <div className="flex flex-col gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-brand/20 transition-all">
                  <div className="h-12 w-12 bg-[#3B82F6] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <CreditCard size={24} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Fleet cards</h4>
                  <p className="text-xs text-slate-500 font-medium">Issue virtual fuel and maintenance cards to your entire team.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
               {/* Visual representation of a reconciliation flow */}
               <div className="bg-slate-900 rounded-[3.5rem] p-4 border border-white/10 shadow-2xl overflow-hidden aspect-[4/3] relative flex flex-col">
                  <div className="bg-slate-800 rounded-t-[2.5rem] h-12 flex items-center px-6 gap-2 border-b border-white/5">
                     <div className="h-2 w-2 bg-slate-600 rounded-full" />
                     <div className="h-2 w-2 bg-slate-600 rounded-full" />
                     <div className="h-2 w-2 bg-slate-600 rounded-full" />
                  </div>
                  <div className="p-8 flex flex-col gap-6 flex-grow">
                     <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-brand/20 rounded-xl flex items-center justify-center text-brand">
                              <Wallet size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase">Payout Pending</p>
                              <p className="text-white font-black">2,450.00 KES</p>
                           </div>
                        </div>
                        <div className="h-8 w-20 bg-brand text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center justify-center">Reconcile</div>
                     </div>

                     <div className="flex-grow flex flex-col gap-3">
                        <div className="h-2 w-full bg-white/5 rounded-full" />
                        <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                        <div className="grid grid-cols-4 gap-4 mt-4">
                           {[1,2,3,4].map(i => (
                             <div key={i} className="h-12 bg-white/5 rounded-xl border border-white/5" />
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="absolute bottom-[-20%] left-[-10%] h-80 w-80 bg-brand/10 blur-[100px] rounded-full" />
               </div>
               
               {/* Floating elements */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute top-10 -right-10 bg-[#0F172A] border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl z-20"
               >
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <CheckCircle size={16} />
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-white font-black text-xs">Settlement Paid</p>
                     </div>
                  </div>
               </motion.div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Pricing Section */}
      <SectionWrapper id="pricing" className="py-48 bg-white border-t border-slate-100">
        <div className="container-responsive">
          <div className="mb-32">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-tight">Pricing.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <PricingTier 
              tier="Pilot"
              price="Early Access"
              desc="For founding partners"
              features={[
                "Co-development support",
                "Custom ERP integration",
                "White-glove onboarding",
                "Priority feature requests"
              ]}
              cta="Apply for Pilot"
              onClick={() => navigate('/contact')}
            />
            <PricingTier 
              tier="Growth"
              price="$199"
              desc="Most Popular"
              featured={true}
              features={[
                "Advanced telemetry",
                "Multi-hub sync",
                "24/7 Priority support",
                "API Access"
              ]}
              cta="Request Access"
              onClick={() => navigate('/register')}
            />
            <PricingTier 
              tier="Enterprise"
              price="Custom"
              desc="Continental Scale"
              features={[
                "On-premise options",
                "Custom compliance rules",
                "Dedicated engineering team",
                "Unlimited nodes"
              ]}
              cta="Book Consultation"
              onClick={() => navigate('/contact')}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Final CTA Section */}
      <SectionWrapper className="py-48 relative overflow-hidden bg-[#0B0E16] border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2600&auto=format&fit=crop" 
            alt="Logistics Operations" 
            className="w-full h-full object-cover opacity-60 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[#0B0E16]/50" />
        </div>

        <div className="container-responsive relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-12 leading-tight">
              Join the <br/><span className="text-brand">first wave.</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 font-medium mb-16 leading-relaxed">
              We're onboarding pilot partners now. <br className="hidden md:block" /> Be part of the team shaping it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-20 py-10 bg-brand hover:bg-brand-orange-dark text-white text-base font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:translate-y-[-4px] active:scale-95 rounded-3xl"
              >
                Sign up free
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="w-full sm:w-auto px-20 py-10 bg-white/5 border-2 border-white/10 text-white text-base font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all rounded-3xl"
              >
                Talk to our team
              </button>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* FAQ + Contact Section (v2: image 12 split layout -- form left, accordion right) */}
      <SectionWrapper className="py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
          <div className="mb-16 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand mb-4">Frequently asked questions</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[0.95] uppercase">
              Got more questions? <br />
              <span className="text-brand">We're here to help.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Left: contact form */}
            <div className="lg:col-span-2 bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Just send us a message &mdash;</h3>
              <p className="text-sm text-slate-500 mb-8">We're here to help with your questions.</p>
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); navigate('/contact'); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Name</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-brand transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Phone</label>
                    <input type="tel" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-brand transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Email</label>
                  <input type="email" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-brand transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Message</label>
                  <textarea rows={4} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-brand transition-colors resize-none" />
                </div>
                <button type="submit" className="w-full bg-brand hover:bg-brand-orange-dark text-white text-sm font-bold py-4 rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-95">
                  Send message
                </button>
              </form>
            </div>

            {/* Right: FAQ accordion */}
            <div className="lg:col-span-3 space-y-2">
              <FAQItem
                question="Where is my data stored?"
                answer="Your data lives in regional Supabase clusters with row-level security. We comply with GDPR, Kenya's DPA, and Nigeria's NDPR."
              />
              <FAQItem
                question="How long does setup take?"
                answer="Pilot partners are typically up and running within a day. Larger fleets, about a week, with our team alongside you."
              />
              <FAQItem
                question="What kind of support do you offer?"
                answer="Pilot partners get direct chat with our team while we shape the product together. Plan-tiered support kicks in as we scale beyond pilot."
              />
              <FAQItem
                question="Do you handle customs clearance?"
                answer="Cross-border customs is on the roadmap. For now, Shipstack tracks customs documents and timestamps but doesn't file them on your behalf."
              />
              <FAQItem
                question="How can I track my shipment?"
                answer="Every delivery note has a public tracking link your customer can open. Drivers also see status from the driver PWA."
              />
              <FAQItem
                question="What if my shipment is lost or damaged?"
                answer="Exceptions are first-class in Shipstack: report them in-app with a photo, and we flag the affected delivery + a follow-up task automatically."
              />
              <FAQItem
                question="Do you offer eco-friendly shipping options?"
                answer="We surface route efficiency metrics so you can pick the lowest-fuel option. A dedicated low-carbon mode is on the roadmap."
              />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-10 right-10 z-[100] h-14 w-14 bg-brand text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-brand/40"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </MarketingLayout>
  );
};

export default LandingPage;
