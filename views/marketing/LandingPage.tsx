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
  MousePointer2
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
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 bg-[#0F172A] overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2600&auto=format&fit=crop" 
            alt="Logistics Operations Control" 
            className="w-full h-full object-cover opacity-20 scale-105 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 via-[#0F172A]/40 to-[#0F172A]" />
        </div>

        <div className="container-responsive relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 flex justify-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Live Control Tower V2.4 Active</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-[8.5rem] font-black tracking-tighter leading-[0.8] mb-12 uppercase text-white">
              The OS for <br />
              African <span className="text-brand">Trade.</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center max-w-4xl mx-auto mb-20"
          >
            <p className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-tight leading-tight">
              A high-precision control tower for transport teams. <br className="hidden md:block" />
              Manage fleet telemetry, driver payouts, and ERP reconciliation in one interface.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-0"
          >
            <button 
              onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
              className="w-full sm:w-auto px-16 py-8 bg-brand hover:bg-orange-600 text-white text-base font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(255,140,66,0.2)] transition-all hover:translate-y-[-4px] active:scale-95 rounded-2xl flex items-center justify-center gap-3"
            >
              Start Pilot Node
              <ArrowRight size={20} />
            </button>
            {!isAuthenticated && (
              <button 
                onClick={() => navigate('/product')}
                className="w-full sm:w-auto px-16 py-8 bg-white/5 border-2 border-white/10 text-white text-base font-black uppercase tracking-widest transition-all hover:bg-white/10 flex items-center justify-center gap-3 rounded-2xl"
              >
                Logistics Tour
              </button>
            )}
          </motion.div>
        </div>

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
      </section>

      {/* Social Proof */}
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="container-responsive">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-16">Built with logistics operators. Trusted by first-mover teams.</p>
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
                <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">Secure Corridor</span>
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
              Closed Pilot: Now Onboarding Early Adopters for East & West Africa
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
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">
                Hardened<br />
                Operations.
              </h2>
              <p className="text-xl md:text-2xl text-slate-600 font-bold uppercase tracking-tight">Enterprise visibility for frontier logistics markets.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={LayoutDashboard} 
              title="Unified View" 
              desc="Consolidate multiple carriers and internal fleets into a single high-fidelity control panel."
              delay={0}
            />
            <FeatureCard 
              icon={Wallet} 
              title="Settlement Engine" 
              desc="Automated driver payments and carrier reconciliation integrated with local mobile money networks."
              delay={0.1}
            />
            <FeatureCard 
              icon={Navigation} 
              title="Fleet Telemetry" 
              desc="Sub-second GPS precision and vehicle health diagnostics streaming from every active node."
              delay={0.2}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Comparison Section */}
      <SectionWrapper className="py-48 bg-slate-900 border-y border-white/5 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter text-white mb-6">Built to <span className="text-brand">Compete.</span></h2>
            <p className="text-slate-400 font-bold uppercase tracking-tight">The Shipstack advantage is quantifiable.</p>
          </div>
          
          <div className="overflow-x-auto pb-12">
            <div className="min-w-[800px]">
               <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                   <tr>
                     <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Infrastructure Metrics</th>
                     <th className="py-8 px-10">
                        <div className="bg-brand text-white px-6 py-4 rounded-xl inline-block text-xl font-black uppercase tracking-tight shadow-xl shadow-brand/20">Shipstack</div>
                     </th>
                     <th className="py-8 px-10 text-xl font-black uppercase tracking-tight text-slate-400">Enterprise Legacy</th>
                     <th className="py-8 px-10 text-xl font-black uppercase tracking-tight text-slate-400">Manual Operations</th>
                   </tr>
                 </thead>
                 <tbody className="text-white">
                   {[
                     { feature: "System Latency", shipstack: "<250ms", trad: "2.5s - 5s", diy: "N/A" },
                     { feature: "Deployment Speed", shipstack: "Instant", trad: "12-24 Weeks", diy: "Permanent Beta" },
                     { feature: "Real-time Telemetry", shipstack: true, trad: "Batch Process", diy: "Manual Logs" },
                     { feature: "M-Pesa Integration", shipstack: true, trad: "No", diy: "Manual Cash" },
                     { feature: "Predictive AI", shipstack: true, trad: "Add-on", diy: "No" },
                     { feature: "Uptime SLA", shipstack: "99.99%", trad: "99.0%", diy: "0%" }
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
      <SectionWrapper className="py-48 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
           <div className="absolute inset-0 bg-[#0F172A]/90 z-10" />
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
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6">Operations Infrastructure</p>
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white mb-8 leading-none">The Core Stack.</h2>
                <p className="text-xl text-slate-400 font-bold uppercase tracking-tight">Precision-engineered for the frontier.</p>
             </div>
             <div className="rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(255,140,66,0.1)] border border-white/5 relative group bg-slate-900 aspect-video flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-brand/5 opacity-50" />
                <div className="relative w-full h-full bg-slate-950 rounded-2xl border border-white/10 flex flex-col p-4 shadow-2xl">
                   {/* Mock UI elements */}
                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                         <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">System Link: Online</span>
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
              { title: "Smart Routing", desc: "Dynamic route optimization taking into account local terrain, safety zones, and efficiency.", icon: Navigation },
              { title: "Edge Telemetry", desc: "Direct vehicle health diagnostics and location history stored on an immutable ledger.", icon: Database },
              { title: "Mobile Payouts", desc: "Instant carrier settlements via M-Pesa, Wave, and bank corridors. 0% friction.", icon: Wallet },
              { title: "Central Command", desc: "Total visibility for dispatchers and ops managers in a real-time stream.", icon: LayoutDashboard },
              { title: "Inventory Sync", desc: "Multi-hub warehouse management with real-time SKU tracking across regions.", icon: ClipboardCheck },
              { title: "API Gateway", desc: "Connect Shipstack to your existing SAP, Frappe, or custom ERP systems.", icon: Cog }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-6 group">
                <div className="flex items-center justify-between">
                   <div className="h-14 w-14 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300 shadow-sm border border-white/5">
                      <item.icon size={26} />
                   </div>
                   <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Module 0{i+1}</span>
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
      <SectionWrapper className="py-32 bg-[#1A2B4D]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Built with <span className="text-brand">Operators.</span></h2>
            <p className="text-slate-400 font-bold uppercase tracking-tight">Tested by early-access logistics teams.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-10 mb-10">
             <div className="bg-white rounded-[3rem] p-12 overflow-hidden relative group">
                <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4">Pilot Insights</p>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-6">Optimized Regional Workflows</h3>
                   <p className="text-slate-500 font-medium leading-relaxed mb-8">
                      We spent 6 months on the ground in Nairobi and Lagos to understand how teams actually manage transport exceptions and settlements.
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
                   <p className="text-4xl font-black uppercase tracking-tighter">Pilot Ready</p>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Control Panel</p>
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
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Daily Deliveries Reached</p>
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
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">The Process.</h2>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <StepAction number="1" icon={User} title="Register" desc="Integrate your profile into our secure cloud network." delay={0.1} />
              <StepAction number="2" icon={Truck} title="Configure" desc="Define your corridors and fleet parameters." delay={0.2} />
              <StepAction number="3" icon={MapPin} title="Monitor" desc="Track sub-second telemetry across the continent." delay={0.3} />
              <StepAction number="4" icon={TrendingUp} title="Scale" desc="Leverage AI-driven operational insights." delay={0.4} />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Testimonials section */}
      <SectionWrapper className="py-32 bg-slate-50">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#1A2B4D] mb-6">Partner Insights.</h2>
            <p className="text-slate-500 font-bold uppercase tracking-tight text-sm">Validating the vision with our early-access cohort.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <TestimonialCard 
              quote="Finally, a platform that doesn't ignore the complexities of the African 'last mile'. The visibility into driver settlements is exactly what we needed."
              author="Amara Diallo"
              role="Operations Director"
              company="SwiftRoute Logistics"
              city="Lagos"
              delay={0}
            />
            <TestimonialCard 
              quote="Shipstack's integration with our existing ERP was seamless. It's the first logistics OS that actually feels like it's built for scale, not just hype."
              author="Moussa Keïta"
              role="CTO"
              company="Sahel Freight"
              city="Bamako"
              delay={0.1}
            />
            <TestimonialCard 
              quote="The early-access support has been incredible. They aren't just selling software; they are helping us refine our entire operational flow."
              author="Kwame Mensah"
              role="Founder"
              company="Nexus Courier"
              city="Accra"
              delay={0.2}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Payment Methods Section */}
      <SectionWrapper className="py-48 bg-[#0F172A] border-y border-white/5 overflow-hidden">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6">Fintech Infrastructure</p>
              <h2 className="text-5xl md:text-[7rem] font-black uppercase tracking-tighter text-white mb-10 leading-[0.9]">
                Frictionless <br />
                <span className="text-brand">Payouts.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed mb-16 max-w-xl">
                We handle the complexity of multi-regional settlements. Pay your drivers and carriers instantly after every successful trip reconciliation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex flex-col gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-brand/20 transition-all">
                  <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                    <Activity size={24} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Mobile Money</h4>
                  <p className="text-xs text-slate-500 font-medium">Direct M-Pesa, Wave, and MTN integrations across East & West Africa.</p>
                </div>
                <div className="flex flex-col gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-brand/20 transition-all">
                  <div className="h-12 w-12 bg-[#3B82F6] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <CreditCard size={24} />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Enterprise Card</h4>
                  <p className="text-xs text-slate-500 font-medium">Issue virtual fuel cards and maintenance wallets to your entire fleet.</p>
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
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">Pricing.</h2>
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
      <SectionWrapper className="py-48 relative overflow-hidden bg-slate-900 border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2600&auto=format&fit=crop" 
            alt="Logistics Operations" 
            className="w-full h-full object-cover opacity-60 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/50" />
        </div>

        <div className="container-responsive relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-white mb-12 leading-none">
              Ready to <br/><span className="text-brand">Pilot?</span>
            </h2>
            <p className="text-xl md:text-3xl text-slate-400 font-bold uppercase tracking-tight mb-16 leading-tight">
              Join the first-mover teams building the <br className="hidden md:block" /> future of transport with Shipstack.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-20 py-10 bg-brand hover:bg-orange-600 text-white text-base font-black uppercase tracking-[0.3em] shadow-2xl transition-all hover:translate-y-[-4px] active:scale-95 rounded-3xl"
              >
                Start Your Pilot
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

      {/* FAQ Section */}
      <SectionWrapper className="py-48 bg-white border-t border-slate-100">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-24">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-8">FAQ.</h2>
              <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">System capabilities and integration guidance.</p>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <FAQItem 
                question="Data Sovereignty" 
                answer="We maintain strict compliance with multi-regional data protection frameworks."
              />
              <FAQItem 
                question="Integration Timeline" 
                answer="Standard nodes can be operational within sub-24-hour windows."
              />
              <FAQItem 
                question="Operational Support" 
                answer="Continuous system monitoring and engineer-led priority support available 24/7."
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
