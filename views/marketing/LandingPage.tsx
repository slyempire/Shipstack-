import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  CheckCircle,
  Zap, 
  Globe,
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

const PricingTier = ({ tier, price, desc, features, cta, featured }: any) => (
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
    <button className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
        {/* Slow Ken-Burns Background */}
        <div className="absolute inset-0 z-0 bg-[#1A2B4D]">
          <motion.img 
            initial={{ scale: 1 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: 60, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
            alt="Logistics Background" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          
          {/* Map Grid Overlay - CSS Only */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
            style={{ 
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }} 
          />

          {/* Route Lines Overlay - CSS Only */}
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, transparent, transparent 120px, rgba(255, 140, 66, 0.15) 120px, rgba(255, 140, 66, 0.15) 121px),
                repeating-linear-gradient(-45deg, transparent, transparent 180px, rgba(255, 140, 66, 0.1) 180px, rgba(255, 140, 66, 0.1) 181px)
              `
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#1A2B4D]/60 via-[#1A2B4D]/90 to-[#1A2B4D]"></div>
        </div>

        <div className="container-responsive relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-full mb-8">
              <Globe size={14} className="text-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand">The Operating System for African Trade</span>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase text-white"
          >
            Logistics Built <br />
            <span className="text-brand">For Africa.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-16 font-medium leading-relaxed"
          >
            Manage deliveries, track shipments in real time, and scale your logistics operations—whether you're in Nairobi, Lagos, or beyond.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
              className="w-full sm:w-auto px-12 py-6 bg-brand hover:bg-[#E07A35] text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-brand/20"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
            </button>
            <button className="w-full sm:w-auto px-12 py-6 border-2 border-white/20 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-white/5 transition-all">
              Watch Demo
            </button>
          </motion.div>

          <TrustBadge />
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-[#121E36] py-16 border-y border-white/5">
        <div className="container-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatItem icon={User} value="1,500+" label="Active Operators" />
            <StatItem icon={Truck} value="50,000+" label="Deliveries/Month" />
            <StatItem icon={Activity} value="99.2%" label="On-Time Rate" />
            <StatItem icon={Globe} value="12" label="African Cities" />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <SectionWrapper className="py-32 px-4 bg-[#1A2B4D]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Built for <span className="text-brand">Growth.</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">Stabilize your supply chain and empower your workforce with enterprise-grade tools.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <FeatureCard 
              icon={ShieldCheck} 
              title="Bank-Level Security" 
              desc="Your shipment data is encrypted and immutable, giving you and your customers complete peace of mind. Built with enterprise-grade blockchain verification."
              delay={0}
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="MSME Empowerment" 
              desc="Built specifically for African logistics businesses. Whether you run 10 or 10,000 deliveries a day, Shipstack grows with your business."
              delay={0.1}
            />
            <FeatureCard 
              icon={MapPin} 
              title="Real-Time Tracking" 
              desc="Track every shipment live on a map. Your customers get automatic SMS and WhatsApp updates at every step of their delivery journey."
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
      <SectionWrapper className="py-32 bg-[#121E36]">
        <div className="container-responsive">
          <div className="text-center mb-24">
             <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">What's <span className="text-brand">Included?</span></h2>
             <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">Everything you need to run a high-performance logistics business, from day one.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-16">
            {[
              { title: "Intelligent Dispatch", desc: "AI-driven task allocation for maximum fleet efficiency." },
              { title: "Cold-Chain Monitoring", desc: "IoT-enabled temperature tracking for medical/food cargo." },
              { title: "Marketplace Automation", desc: "Seamlessly connect shippers with verified carriers." },
              { title: "Real-Time Tracking", desc: "LIVE GPS visibility for every package and vehicle in your fleet." },
              { title: "M-Pesa Integration", desc: "Instant mobile money settlements for drivers and fuel." },
              { title: "Predictive Analytics", desc: "Anticipate supply chain bottlenecks before they impact SLAs." },
              { title: "Driver Management", desc: "Comprehensive portal for onboarding and performance." },
              { title: "Warehouse Tools", desc: "Smart inventory management optimized for speed." },
              { title: "API Access", desc: "Enterprise-grade REST APIs to sync with your internal systems." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 group hover:translate-x-1 transition-transform">
                <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-all">
                  <CheckCircle size={24} className="text-brand group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
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
      <SectionWrapper className="py-32 bg-[#121E36] relative overflow-hidden">
        <div className="container-responsive relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">How it <span className="text-brand">Works.</span></h2>
          </div>
          
          <div className="relative">
            {/* Connecting Lines (Desktop) */}
            <div className="hidden lg:block absolute top-10 left-0 w-full h-[2px] bg-white/5 z-0">
               <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: '80%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-brand mx-auto"
               />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
              <StepAction number="1" icon={User} title="Create Account" desc="Sign up in minutes and verify your business details." delay={0.1} />
              <StepAction number="2" icon={Truck} title="Routes & Drivers" desc="Onboard your fleet and define your delivery corridors." delay={0.2} />
              <StepAction number="3" icon={MapPin} title="Start Tracking" desc="Create delivery notes and watch them live on the map." delay={0.3} />
              <StepAction number="4" icon={TrendingUp} title="Scale Operations" desc="Use AI insights to optimize routes and grow your business." delay={0.4} />
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
      <SectionWrapper id="pricing" className="py-32 bg-[#1A2B4D]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Simple <span className="text-brand">Pricing.</span></h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <PricingTier 
              tier="Basic"
              price="Free"
              desc="For small operators"
              features={[
                "Up to 100 deliveries/mo",
                "1 Active driver",
                "Basic shipment tracking",
                "Email support"
              ]}
              cta="Get Started Free"
            />
            <PricingTier 
              tier="Pro"
              price="$29"
              desc="For growing businesses"
              featured={true}
              features={[
                "Unlimited deliveries",
                "Up to 20 drivers",
                "Real-time GPS tracking",
                "M-Pesa integration",
                "Priority 24/7 support"
              ]}
              cta="Start Pro Trial"
            />
            <PricingTier 
              tier="Enterprise"
              price="Custom"
              desc="For large operators"
              features={[
                "Everything in Pro",
                "Full API access",
                "Custom integrations",
                "Dedicated account manager",
                "SLA guarantee"
              ]}
              cta="Contact Sales"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ Section */}
      <SectionWrapper className="py-32 bg-[#1A2B4D] border-t border-white/5">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-20">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">Common <span className="text-brand">Questions.</span></h2>
              <p className="text-slate-400 font-medium leading-relaxed">Everything you need to know about the Shipstack platform and our operations across Africa.</p>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <FAQItem 
                question="How secure is my data?" 
                answer="All data encrypted with enterprise-grade AES-256 protocols and stored on redundant, ISO-certified African servers. We maintain strict chain-of-custody for all shipment records."
              />
              <FAQItem 
                question="How long does setup take?" 
                answer="Most operators are live within 24 hours. Our onboarding team guides you through driver enrollment, route definition, and system integration personally."
              />
              <FAQItem 
                question="Can I use this on mobile?" 
                answer="Yes, Shipstack works flawlessly on any smartphone browser. We also provide native iOS and Android apps for drivers for optimal offline support."
              />
              <FAQItem 
                question="What about data privacy?" 
                answer="We strictly comply with data protection laws across Kenya (ODPC), Nigeria (NDRP), Uganda, and South Africa. Your data belongs to you—we just make it work harder."
              />
              <FAQItem 
                question="Is there customer support?" 
                answer="Absolutely. We provide 24/7 technical support via WhatsApp, email, and phone in English, Swahili, and French to ensure your operations never stop."
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
