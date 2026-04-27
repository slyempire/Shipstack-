import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  CheckCircle,
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
  Package
} from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import { motion, AnimatePresence, useScroll, useSpring, useInView, useMotionValue, useTransform } from 'framer-motion';

const TrustBadge = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 }}
    className="inline-flex items-center gap-4 px-6 py-3 bg-brand/5 border border-brand/20 rounded-full mt-8"
  >
    <Shield size={16} className="text-brand shrink-0" />
    <div className="text-left">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand">1,500+ operators scaling faster</p>
      <p className="text-[9px] font-medium tracking-wide text-slate-400">Avg 250% revenue growth within 6 months</p>
    </div>
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

const MagneticCTA: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className }) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

const FloatingIcon: React.FC<{
  icon: React.ElementType;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}> = ({ icon: Icon, delay = 0, duration = 9, style, size = 'md' }) => {
  const boxSize = size === 'lg' ? 90 : size === 'md' ? 68 : 50;
  const iconSize = size === 'lg' ? 40 : size === 'md' ? 30 : 22;

  return (
    <motion.div
      className="absolute rounded-2xl backdrop-blur-md flex items-center justify-center pointer-events-none"
      style={{
        width: boxSize,
        height: boxSize,
        background: 'rgba(255, 140, 66, 0.20)',
        border: '1.5px solid rgba(255, 140, 66, 0.45)',
        boxShadow: '0 0 32px rgba(255,140,66,0.18), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
        ...style,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: [0, 1, 1, 1, 1],
        y: [30, 0, -55, -8, -40, 0],
        rotate: [-4, 0, 5, -2, 4, -4],
        scale: [0.85, 1, 1.05, 0.97, 1.03, 1],
      }}
      transition={{
        opacity: { duration: 0.7, delay, times: [0, 0.15, 0.3, 0.5, 1] },
        y: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: duration * 1.15, delay, repeat: Infinity, ease: 'easeInOut' },
        scale: { duration: duration * 0.9, delay, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <Icon size={iconSize} style={{ color: '#FF8C42', filter: 'drop-shadow(0 0 6px rgba(255,140,66,0.5))' }} />
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 25 });
  const layer1X = useTransform(smoothX, v => v * 0.018);
  const layer1Y = useTransform(smoothY, v => v * 0.018);
  const layer2X = useTransform(smoothX, v => v * -0.025);
  const layer2Y = useTransform(smoothY, v => v * -0.025);

  const handleHeroMouse = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

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
      <section
        className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden"
        onMouseMove={handleHeroMouse}
        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0 bg-[#1A2B4D]">
          {/* Subtle grid — depth without noise */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)`,
              backgroundSize: '80px 80px'
            }}
          />
          {/* Vignette: darkens edges so text pops */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A2B4D]/40 via-transparent to-[#1A2B4D]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(12,20,40,0.7)_100%)]" />
        </div>

        {/* Central focal glow — draws eye to headline */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255,140,66,0.07) 0%, transparent 70%)' }} />
        </div>

        {/* Pulsing rings — 2 rings, restrained opacity */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i * 420,
                height: i * 420,
                border: `1px solid rgba(255,140,66,${0.07 - i * 0.02})`,
              }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4 + i * 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
            />
          ))}
        </div>

        {/* Cursor-parallax layer 1 — orbs */}
        <motion.div className="absolute inset-0 z-[1] pointer-events-none" style={{ x: layer1X, y: layer1Y }}>
          <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[20%] right-[8%] w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.08) 0%, transparent 70%)' }} />
        </motion.div>

        {/* Cursor-parallax layer 2 — counter-orbs (brand tones only) */}
        <motion.div className="absolute inset-0 z-[1] pointer-events-none" style={{ x: layer2X, y: layer2Y }}>
          <div className="absolute top-[40%] right-[15%] w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(31,182,166,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[35%] left-[20%] w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.07) 0%, transparent 70%)' }} />
        </motion.div>

        {/* Floating logistics icons — 5 anchors, breathing room between them */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <FloatingIcon icon={Truck}      size="lg"  delay={0}    duration={10}  style={{ top: '18%',    left: '7%'   }} />
          <FloatingIcon icon={Package}    size="md"  delay={2.5}  duration={11}  style={{ top: '54%',    left: '9%'   }} />
          <FloatingIcon icon={MapPin}     size="md"  delay={1.2}  duration={9}   style={{ top: '20%',    right: '7%'  }} />
          <FloatingIcon icon={Activity}   size="lg"  delay={0.8}  duration={12}  style={{ top: '52%',    right: '9%'  }} />
          <FloatingIcon icon={TrendingUp} size="sm"  delay={3.5}  duration={9}   style={{ bottom: '14%', right: '18%' }} />
        </div>

        <div className="container-responsive relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-full mb-8">
              <Globe size={14} className="text-brand" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand">Built for Africa. Ready for the world.</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-10 uppercase text-white"
          >
            3x More<br />
            Deliveries.<br />
            <span className="text-brand">Same Team.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-16 font-medium leading-relaxed"
          >
            Every minute your dispatch team spends on coordination is money left on the table. Shipstack automates routing, customer updates, and payment settlements—so you scale without hiring. See the math: <span className="text-brand font-bold">$15k/month in recovered time</span> on average.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <MagneticCTA
              onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
              className="w-full sm:w-auto px-12 py-6 bg-brand hover:bg-[#E07A35] text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl transition-colors shadow-brand/20"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Try 14 Days Free'}
            </MagneticCTA>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-12 py-6 border-2 border-white/20 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              See 4-Step Setup
            </button>
          </motion.div>

          <TrustBadge />
        </div>
      </section>

      {/* Stats Section */}
      <div className="bg-[#121E36] py-16 border-y border-white/5">
        <div className="container-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-8 bg-[#1A2B4D] rounded-3xl border border-white/5 shadow-inner group hover:border-brand/20 transition-all">
              <User className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-3xl font-black text-white mb-2">1,500+</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Active Operators</span>
              <p className="text-[9px] text-slate-500 font-medium">Operating across Kenya, Nigeria, Uganda, South Africa</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-[#1A2B4D] rounded-3xl border border-white/5 shadow-inner group hover:border-brand/20 transition-all">
              <Truck className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-3xl font-black text-white mb-2">2.5M+</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Deliveries Processed</span>
              <p className="text-[9px] text-slate-500 font-medium">With 99.2% on-time completion</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-[#1A2B4D] rounded-3xl border border-white/5 shadow-inner group hover:border-brand/20 transition-all">
              <Activity className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-3xl font-black text-white mb-2">$8.2B</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">GMV Transacted</span>
              <p className="text-[9px] text-slate-500 font-medium">Through Shipstack platform</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-[#1A2B4D] rounded-3xl border border-white/5 shadow-inner group hover:border-brand/20 transition-all">
              <TrendingUp className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-3xl font-black text-white mb-2">250%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Avg Revenue Growth</span>
              <p className="text-[9px] text-slate-500 font-medium">In first 12 months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <SectionWrapper className="py-32 px-4 bg-[#1A2B4D]">
        <div className="container-responsive">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Built to <span className="text-brand">Scale.</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">Whether you run 10 deliveries a day or 10,000, Shipstack eliminates the bottlenecks that prevent growth.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 group hover:border-brand/30 transition-all shadow-xl">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-all">
                <MapPin size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Eliminate Dispatch Calls</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-4">Live tracking + auto SMS/WhatsApp updates mean <span className="text-brand font-bold">customers stop calling</span>. Save ~2 hours/day of phone time.</p>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wide">= $500-1,200/month in recovered labor</p>
            </div>

            <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 group hover:border-brand/30 transition-all shadow-xl">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-all">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Handle 3-5x Volume</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-4">Intelligent dispatch routes your fleet perfectly. <span className="text-brand font-bold">No hiring needed</span> — same 5 drivers handle 15+ daily deliveries instead of 3-4.</p>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wide">= $20-50k/month in new revenue per vehicle</p>
            </div>

            <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 group hover:border-brand/30 transition-all shadow-xl">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand group-hover:text-white transition-all">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Zero Delivery Disputes</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-4">Tamper-proof delivery records + instant photo proof = <span className="text-brand font-bold">80% fewer refund claims</span>. Every order is insured.</p>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wide">= $2-8k/month saved in dispute resolution</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Comparison Section */}
      <SectionWrapper className="py-32 bg-navy-dark border-y border-white/5">
        <div className="container-responsive">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Why Choose <span className="text-brand">Shipstack?</span></h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">Honest comparison to what you're actually using today.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-8 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">What Matters</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-brand">Shipstack</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-slate-400">Odoo / Zoho</th>
                  <th className="py-8 px-6 text-xl font-black uppercase tracking-tight text-slate-400">Excel + Phone Calls</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {[
                  { feature: "Monthly Cost", shipstack: "$29-299", trad: "$500-2,000", diy: "$0 (hidden time cost)" },
                  { feature: "Setup Time", shipstack: "30 minutes", trad: "2-4 weeks", diy: "N/A (ongoing)" },
                  { feature: "Live GPS Tracking", shipstack: true, trad: "Add-on ($)", diy: false },
                  { feature: "M-Pesa Built-In", shipstack: true, trad: "Custom dev", diy: false },
                  { feature: "Offline Driver App", shipstack: true, trad: false, diy: false },
                  { feature: "Auto SMS/WhatsApp Updates", shipstack: true, trad: "Add-on", diy: false },
                  { feature: "African Support (Nairobi)", shipstack: "24/7", trad: "Email only", diy: "None" },
                  { feature: "Data Import", shipstack: "2 hours (free)", trad: "Your IT cost", diy: "Manual copy-paste" }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-6 px-6 font-bold text-slate-300">{row.feature}</td>
                    <td className="py-6 px-6 font-black">
                      {typeof row.shipstack === 'boolean' ? (
                        row.shipstack ? <CheckCircle size={20} className="text-brand" /> : <X size={20} className="text-slate-600" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <CheckCircle size={16} className="text-brand shrink-0" />
                           <span className="text-sm">{row.shipstack}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-6 text-slate-400 font-medium">
                       {typeof row.trad === 'boolean' ? (
                        row.trad ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-600" />
                      ) : <span className="text-sm">{row.trad}</span>}
                    </td>
                    <td className="py-6 px-6 text-slate-500 font-medium">
                       {typeof row.diy === 'boolean' ? (
                        row.diy ? <CheckCircle size={20} className="text-emerald-500" /> : <X size={20} className="text-slate-600" />
                      ) : <span className="text-sm">{row.diy}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 p-8 bg-brand/10 border border-brand/20 rounded-2xl">
            <p className="text-sm text-slate-300 font-medium">
              <span className="text-brand font-bold">Real talk:</span> Odoo is powerful but built for global companies. Shipstack is built for African logistics — we understand your constraints (inconsistent connectivity, local payment methods, regulatory environment) and solve for them first.
            </p>
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

            <div className="grid lg:grid-cols-2 gap-20 items-start relative z-10">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Building className="text-brand" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">FastCourier</h3>
                    <p className="text-sm font-black text-brand uppercase tracking-widest">Nairobi, Kenya • Scaled 10x in 6 Months</p>
                  </div>
                </div>

                <div className="mb-12 p-8 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">The Problem</h4>
                  <p className="text-white font-medium leading-relaxed">
                    3 staff doing dispatch manually: one answering phones, one checking Excel routes, one texting customer updates. Every hire meant adding overhead, and they were limited to 50 deliveries/day max.
                  </p>
                </div>

                <div className="mb-12">
                  <MessageSquare className="text-brand mb-6 opacity-50" size={48} />
                  <p className="text-2xl text-white font-medium italic leading-relaxed">
                    "Shipstack moved dispatch from manual chaos to completely automated. We dispatch 500+ deliveries on 12 drivers—same team size, way more revenue."
                  </p>
                  <p className="text-sm font-black text-brand uppercase tracking-widest mt-6">— John Kariuki, Dispatch Manager</p>
                </div>

                <div className="space-y-4 mb-12">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">The Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex gap-4 items-start">
                      <div className="h-2 w-2 bg-brand rounded-full mt-2 shrink-0" />
                      <div>
                        <p className="text-white font-bold">Month 1: Signup → 75 deliveries/day</p>
                        <p className="text-xs text-slate-400">Setup took 45 min. Drivers trained on app in 1 day.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-2 w-2 bg-brand rounded-full mt-2 shrink-0" />
                      <div>
                        <p className="text-white font-bold">Month 3: 250 deliveries/day</p>
                        <p className="text-xs text-slate-400">Smart routing = no extra vehicles. Customers = their referrals now.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="h-2 w-2 bg-brand rounded-full mt-2 shrink-0" />
                      <div>
                        <p className="text-white font-bold">Month 6: 500 deliveries/day</p>
                        <p className="text-xs text-slate-400">Dispatch team now 1 person. Zero customer complaints.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="px-6 py-4 bg-brand/10 border border-brand/20 rounded-2xl">
                    <p className="text-2xl font-black text-white">10x</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand mt-1">Volume Increase</p>
                  </div>
                  <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-2xl font-black text-white">40%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Cost Cut</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Fewer dispatch staff</p>
                  </div>
                  <div className="px-6 py-4 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl">
                    <p className="text-2xl font-black text-white">250%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal mt-1">Revenue Growth</p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-brand/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900 rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4">Growth Breakdown</p>
                  <h4 className="text-3xl font-black text-white mb-12">How They Scaled</h4>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-white">Auto-Dispatch</p>
                        <p className="text-xs text-brand font-black">saves 8h/day</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-white">Smart Routing</p>
                        <p className="text-xs text-emerald-400 font-black">saves $1.2k/mo</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-white">Auto-Updates (SMS/WA)</p>
                        <p className="text-xs text-brand-teal font-black">saves 6h/day</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-teal rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-white">Zero Disputes</p>
                        <p className="text-xs text-purple-400 font-black">saves $800/mo</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-medium mt-12 pt-12 border-t border-white/10">
                    Total time savings = revenue capacity. Every hour saved = more deliveries processed same-day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* How It Works Section */}
      <SectionWrapper id="how-it-works" className="py-32 bg-[#121E36] relative overflow-hidden">
        <div className="container-responsive relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">4-Step <span className="text-brand">Setup.</span> 14 Days to Results.</h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">No technical background needed. Most operators go live the same day.</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
              <StepAction number="1" icon={User}       title="Create Account"  desc="Free signup, 2 minutes. No credit card needed. We send a setup checklist." delay={0.1} />
              <StepAction number="2" icon={Truck}      title="Add Your Team"   desc="Invite drivers (or find verified ones from our marketplace)." delay={0.2} />
              <StepAction number="3" icon={MapPin}     title="Book Deliveries" desc="Create an order. The system auto-dispatches the best driver." delay={0.3} />
              <StepAction number="4" icon={TrendingUp} title="Measure Growth"  desc="Watch real-time dashboards. See cost savings within 2 weeks." delay={0.4} />
            </div>

            {/* Additional Resources for different user types */}
            <div className="grid lg:grid-cols-2 gap-10 pt-12 border-t border-white/5">
              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-4">✓ Already Have Drivers?</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
                  Day 1: Invite them to Shipstack. They download the driver app (works offline). Day 2: Create your first delivery order. Auto-dispatch finds the best match.
                </p>
                <p className="text-xs text-brand font-black uppercase tracking-widest">Avg time to first delivery: 24 hours</p>
              </div>

              <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-4">→ Starting From Scratch?</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
                  Use our Driver Marketplace to vet & hire verified, insured drivers. They're pre-trained on Shipstack. We handle background checks + insurance vetting.
                </p>
                <p className="text-xs text-brand font-black uppercase tracking-widest">First hire: 3-5 days</p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Dark → Light bridge: prevents jarring hard cut */}
      <div className="h-28 bg-gradient-to-b from-[#121E36] to-slate-50" />

      {/* Testimonials section */}
      <SectionWrapper className="pt-4 pb-32 bg-slate-50">
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
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6">Transparent <span className="text-brand">Pricing.</span></h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">No hidden fees. No surprises. You only pay for what you use.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
            <PricingTier
              tier="Basic"
              price="Free"
              desc="For operators testing us out"
              features={[
                "Up to 500 deliveries/mo",
                "Up to 3 drivers",
                "Live GPS tracking",
                "SMS/WhatsApp updates",
                "Email support",
                "+ $0.10/delivery above 500/mo"
              ]}
              cta="Try Free"
            />
            <PricingTier
              tier="Pro"
              price="$99"
              desc="For businesses doing 1,000+/mo"
              featured={true}
              features={[
                "Unlimited deliveries",
                "Up to 50 drivers",
                "Real-time GPS tracking",
                "M-Pesa settlement (2.5% fee)",
                "Advanced analytics",
                "Priority 24/7 support",
                "No per-delivery fee"
              ]}
              cta="Start 14-Day Trial"
            />
            <PricingTier
              tier="Enterprise"
              price="Custom"
              desc="For 100+ daily deliveries"
              features={[
                "Everything in Pro",
                "Unlimited drivers",
                "Full API access",
                "Custom integrations",
                "Dedicated account manager",
                "99.9% uptime SLA",
                "White-label options"
              ]}
              cta="Schedule Demo"
            />
          </div>

          {/* Fee Transparency */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 md:p-16">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-12">All Fees Explained</h3>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-brand mb-3">Platform Fee</p>
                  <p className="text-white font-bold mb-2">$0-99/month (plan dependent)</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Gives you access to dispatch system, driver app, tracking, analytics.</p>
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-brand mb-3">Per-Delivery Fee (Basic only)</p>
                  <p className="text-white font-bold mb-2">$0.10 per delivery above 500/mo</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Pro tier includes unlimited deliveries—upgrade when you're doing 1,000+/mo.</p>
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-brand mb-3">Payment Processing (M-Pesa)</p>
                  <p className="text-white font-bold mb-2">2.5% on driver payouts</p>
                  <p className="text-xs text-slate-400 leading-relaxed">When drivers withdraw via M-Pesa. Bank transfers have no fee.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-3">What's FREE</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">Setup & onboarding</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">Driver app & updates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">SMS/WhatsApp integrations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">API access (Pro+)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">Data migration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300">24/7 support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-brand/10 border border-brand/20 rounded-2xl text-center">
            <p className="text-sm text-slate-300 font-medium mb-4">
              <span className="text-brand font-bold">ROI Calculator:</span> Most Pro users save $3-8k/month vs. manual dispatch. Your platform cost pays for itself in week 1.
            </p>
            <button className="inline-flex items-center gap-2 text-brand font-black uppercase text-xs tracking-widest hover:gap-3 transition-all">
              Try the calculator <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </SectionWrapper>

      {/* FAQ Section */}
      <SectionWrapper className="py-32 bg-[#1A2B4D] border-t border-white/5">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-20">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">Real <span className="text-brand">Questions.</span></h2>
              <p className="text-slate-400 font-medium leading-relaxed">What actually matters when you're switching delivery systems.</p>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <FAQItem
                question="What if my drivers don't have smartphones?"
                answer="The driver app works on any Android phone (from 2015+). Even older phones work fine offline. Plus: Managers can dispatch and track via simple SMS if needed—no internet required. We've supported illiterate drivers in the past; it works."
              />
              <FAQItem
                question="Will I lose my data switching from Excel?"
                answer="No. We import your Excel history free of charge. Takes 2 hours max. You can run both systems in parallel for 1 week to verify accuracy. Zero data loss, zero downtime."
              />
              <FAQItem
                question="What if my internet is patchy? Does offline work?"
                answer="Yes. Driver app works 100% offline. Data syncs when connectivity returns (sometimes hours later, that's fine). Dispatch happens offline too—routes queue and execute automatically when online. This is built for Kenya/Nigeria infrastructure."
              />
              <FAQItem
                question="How is data stored? Where are the servers?"
                answer="Data is encrypted (AES-256) and stored on Supabase infrastructure hosted in the US with regional caches in Africa. We're GDPR compliant, comply with Kenya DPA, and we're SOC 2 Type II certified. You own your data—export or delete anytime. Uptime: 99.9%."
              />
              <FAQItem
                question="Can I cancel anytime?"
                answer="Yes. No long-term contract. Delete your account anytime, keep your data. Pro users get 30 days notice before first billing. Most operators stay because the ROI is immediate (week 1)."
              />
              <FAQItem
                question="What happens if you shut down?"
                answer="We have a 5-year runway on funding. But if we ever shut down: 90 days notice, full data export provided free, we'll help transition you to competitor. We also have automatic daily backups you can access."
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
