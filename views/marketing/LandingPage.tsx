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
  Users
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
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Trusted by 1,500+ logistics operators across Africa</span>
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
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 bg-white overflow-hidden">
        <div className="container-responsive relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="h-16 w-16 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto shadow-2xl shadow-slate-900/40">
              <Layers size={32} strokeWidth={3} />
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.8] mb-12 uppercase text-slate-900 text-center"
          >
            Logistics.<br />
            Redefined.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-3xl text-slate-400 max-w-4xl mx-auto mb-20 font-bold leading-tight text-center uppercase tracking-tight"
          >
            THE PREMIER OPERATING SYSTEM FOR AFRICAN TRADE AND LOGISTICS NETWORKS.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-0"
          >
            <button 
              onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
              className="w-full sm:w-auto px-12 py-6 bg-slate-900 hover:bg-black text-white text-base font-black uppercase tracking-widest shadow-2xl transition-all hover:translate-y-[-4px] active:scale-95"
            >
              {isAuthenticated ? 'Enter Console' : 'Start Deploying'}
            </button>
            {!isAuthenticated && (
              <button 
                onClick={async () => {
                  const { user, token } = await api.loginDemo();
                  useAuthStore.getState().login(user, token);
                  navigate('/admin');
                }}
                className="w-full sm:w-auto px-12 py-6 bg-white border-2 border-slate-900 text-slate-900 text-base font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
              >
                Launch Demo
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
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-16">Powering Modern Commerce Across Africa</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="h-10 w-32 bg-slate-900 rounded-sm" />
             <div className="h-10 w-24 bg-slate-900 rounded-sm" />
             <div className="h-10 w-40 bg-slate-900 rounded-sm" />
             <div className="h-10 w-28 bg-slate-900 rounded-sm" />
             <div className="h-10 w-36 bg-slate-900 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <SectionWrapper className="py-48 bg-white">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-32">
            <div className="max-w-3xl">
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">
                Built for<br />
                The Future.
              </h2>
              <p className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-tight">Scale your logistics operations with the precision of code.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <FeatureCard 
              icon={ShieldCheck} 
              title="Immutable Security" 
              desc="Every transaction and movement is cryptographically verified on our private ledger."
              delay={0}
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Elastic Scaling" 
              desc="Our serverless architecture handles anywhere from 1 to 1M daily tasks without latency."
              delay={0.1}
            />
            <FeatureCard 
              icon={MapPin} 
              title="Global Visibility" 
              desc="Sub-second latency GPS tracking across urban centers and rural corridors."
              delay={0.2}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Comparison Section */}
      <SectionWrapper className="py-32 bg-navy-dark border-y border-white/5">
        <div className="container-responsive">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Why Choose <span className="text-brand">Shipstack?</span></h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-8 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Feature</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-brand">Shipstack</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-slate-400">Traditional Software</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-slate-400">DIY Spreadsheets</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {[
                  { feature: "Cost", shipstack: "Low/Fixed", trad: "High/CapEx", diy: "Hidden Time Cost" },
                  { feature: "Setup Time", shipstack: "Instant", trad: "Weeks/Months", diy: "Always Building" },
                  { feature: "Mobile-Ready", shipstack: true, trad: false, diy: false },
                  { feature: "Local Payments", shipstack: true, trad: false, diy: false },
                  { feature: "Customer Support", shipstack: "24/7 Local", trad: "Business Hours", diy: "None" }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-6 px-6 font-bold text-slate-300">{row.feature}</td>
                    <td className="py-6 px-6 font-black">
                      {typeof row.shipstack === 'boolean' ? (
                        row.shipstack ? <CheckCircle size={20} className="text-brand" /> : <X size={20} className="text-slate-600" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <CheckCircle size={16} className="text-brand" />
                           {row.shipstack}
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-6 text-slate-500 font-medium">
                       {typeof row.trad === 'boolean' ? (
                        row.trad ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-600" />
                      ) : row.trad}
                    </td>
                    <td className="py-6 px-6 text-slate-500 font-medium">
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
      </SectionWrapper>

      {/* What's Included section */}
      <SectionWrapper className="py-48 bg-white border-t border-slate-100">
        <div className="container-responsive">
          <div className="mb-32">
             <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">Core Modules.</h2>
             <p className="text-xl text-slate-400 font-bold uppercase tracking-tight">The complete logistics stack, built for performance.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-24">
            {[
              { title: "Smart Dispatch", desc: "Automated route optimization and driver assignment." },
              { title: "Telematics", desc: "IoT integration for real-time vehicle and cargo diagnostics." },
              { title: "Fintech", desc: "Instant payments, driver wallets, and automated settlement." },
              { title: "Visibility", desc: "Live dashboard tracking and customer notifications." },
              { title: "Warehouse", desc: "Inventory management across decentralized hubs." },
              { title: "API First", desc: "Build custom integrations on our robust infrastructure." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-6 group">
                <div className="h-[2px] w-12 bg-slate-900 group-hover:w-full transition-all duration-500" />
                <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">{item.title}</h4>
                <p className="text-slate-400 font-medium leading-tight text-sm uppercase tracking-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Case Study Section */}
      <SectionWrapper className="py-32 bg-[#1A2B4D]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Real Stories, <span className="text-brand">Real Growth.</span></h2>
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
                    "Shipstack helped us scale from 50 to 500 deliveries per day in just 6 months. The operational visibility is unmatched."
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
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#1A2B4D] mb-6">Success Stories.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <TestimonialCard 
              quote="Shipstack cut our delivery disputes by 80%. Our customers now trust us completely because they can track every package in real time."
              author="John Kariuki"
              role="Delivery Manager"
              company="FastCourier"
              city="Nairobi"
              delay={0}
            />
            <TestimonialCard 
              quote="We went from 50 to 400 daily deliveries in 4 months. Shipstack's driver management tools are a game-changer for growing logistics businesses."
              author="Amara Diallo"
              role="Founder"
              company="SwiftMove"
              city="Lagos"
              delay={0.1}
            />
            <TestimonialCard 
              quote="The M-Pesa integration alone saved us hours of manual reconciliation every week. Finally, logistics software that understands Africa."
              author="Grace Muthoni"
              role="Operations Lead"
              company="QuickDeliver"
              city="Kampala"
              delay={0.2}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Payment Methods Section */}
      <SectionWrapper className="py-32 bg-[#FF8C42]/5">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#1A2B4D] mb-8">
                <span className="text-brand">Pay</span> Your Way.
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
                We support all major payment methods across Africa—no friction, no barriers. Whether it's mobile money or bank transfers, we've got you covered.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {[
                  { icon: Activity, label: "M-Pesa", color: "text-emerald-600 bg-emerald-50" },
                  { icon: CreditCard, label: "Visa/Mastercard", color: "text-blue-600 bg-blue-50" },
                  { icon: FileText, label: "Invoice/Billing", color: "text-brand bg-orange-50" },
                  { icon: Building, label: "Bank Transfer", color: "text-slate-600 bg-slate-50" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight text-[#1A2B4D]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
               <div className="aspect-video bg-[#1A2B4D] rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Plus size={200} className="text-brand" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4">Payout Infrastructure</p>
                    <h4 className="text-4xl font-black text-white mb-8">Instant Settlement Flow</h4>
                    <div className="space-y-4">
                       {[1,2].map(i => (
                         <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                               <div className="h-8 w-8 bg-white/10 rounded-full" />
                               <div className="h-3 w-32 bg-white/10 rounded-full" />
                            </div>
                            <div className="h-6 w-16 bg-emerald-500/20 rounded-full" />
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
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
              tier="Starter"
              price="Free"
              desc="For solo operators"
              features={[
                "Basic analytics",
                "1 Active channel",
                "Community support"
              ]}
              cta="Deploy Free"
              onClick={() => navigate('/register')}
            />
            <PricingTier 
              tier="Builder"
              price="$49"
              desc="Most Popular"
              featured={true}
              features={[
                "Advanced telemetry",
                "Multi-region support",
                "24/7 Priority SLA"
              ]}
              cta="Start Building"
              onClick={() => navigate('/register')}
            />
            <PricingTier 
              tier="Enterprise"
              price="Custom"
              desc="Global Scale"
              features={[
                "Custom governance",
                "Dedicated hardware",
                "Full API governance"
              ]}
              cta="Contact Engineering"
              onClick={() => navigate('/contact')}
            />
          </div>
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
