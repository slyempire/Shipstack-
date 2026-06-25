import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import {
  ArrowRight, Truck, ShieldCheck, CheckCircle, Zap, Globe, Layers,
  MapPin, Activity, Shield, TrendingUp, MessageSquare, ChevronDown,
  ChevronUp, CreditCard, Building, FileText, User, Plus, X, Target,
  BarChart3, Smartphone, Bell, Users, Navigation, Wallet, LayoutDashboard,
  Search, Database, History, ClipboardCheck, MousePointer2, Cog, ArrowUpRight
} from 'lucide-react';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { KPICard } from '../../components/shared/KPICard';

const DashboardShowcase = React.lazy(() => import('../../components/marketing/ProductShowcase'));

// ── Reduced-motion check ─────────────────────────────────────────────────────
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// ── Section wrapper with scroll-triggered fade-up ────────────────────────────
const SectionWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}> = ({ children, className, id, style }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      style={style}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
      animate={prefersReducedMotion ? {} : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 })}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// ── Feature card (bento-style) ───────────────────────────────────────────────
const FeatureCard: React.FC<{ icon: any; title: string; desc: string; delay?: number; accent?: string; large?: boolean }> = ({
  icon: Icon, title, desc, delay = 0, accent = '#FF5722', large = false
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : (isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 })}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={prefersReducedMotion ? {} : { y: -6 }}
      className={`group relative rounded-3xl border p-8 flex flex-col transition-all duration-300 overflow-hidden ${
        large ? 'col-span-1 md:col-span-2' : ''
      }`}
      style={{
        background: 'rgba(26,31,46,0.7)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}35`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
        style={{ background: `${accent}15`, color: accent }}
      >
        <Icon size={24} />
      </div>
      <h3
        className="text-[18px] font-black text-white mb-3 tracking-tight"
        style={{ textTransform: 'none', letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p className="text-[14px] text-white/55 font-medium leading-relaxed" style={{ textTransform: 'none' }}>
        {desc}
      </p>
      {/* Hover underline accent */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        aria-hidden="true"
      />
    </motion.div>
  );
};

// ── Animated counter stat ────────────────────────────────────────────────────
const StatCounter: React.FC<{ value: number; suffix?: string; label: string; color?: string }> = ({
  value, suffix = '', label, color = '#FF5722'
}) => {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (isInView && !started && !prefersReducedMotion) {
      setStarted(true);
      const steps = 60;
      const interval = 1800 / steps;
      let i = 0;
      const timer = setInterval(() => {
        i++;
        setDisplay(Math.round(value * (i / steps)));
        if (i >= steps) { setDisplay(value); clearInterval(timer); }
      }, interval);
      return () => clearInterval(timer);
    }
    if (prefersReducedMotion) setDisplay(value);
  }, [isInView, value, started]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <div className="text-[3rem] md:text-[3.5rem] font-black text-white leading-none mb-2 tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
        {display.toLocaleString()}{suffix}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40" style={{ textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  );
};

// ── FAQ accordion item ───────────────────────────────────────────────────────
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left gap-4 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF5722] focus-visible:outline-offset-2 rounded-sm"
        aria-expanded={open}
      >
        <span
          className="text-[16px] font-semibold text-white group-hover:text-white/90 transition-colors"
          style={{ textTransform: 'none', letterSpacing: 'normal' }}
        >
          {question}
        </span>
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
          style={{ background: open ? '#FF5722' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Plus
            size={16}
            className="text-white transition-transform duration-300"
            style={{ transform: open ? 'rotate(45deg)' : 'none' }}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <p
              className="pb-6 text-[14px] text-white/55 font-medium leading-relaxed"
              style={{ textTransform: 'none', letterSpacing: 'normal' }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Pricing tier card ────────────────────────────────────────────────────────
const PricingTier: React.FC<{
  tier: string; price: string; desc: string; features: string[];
  cta: string; featured?: boolean; onClick: () => void;
}> = ({ tier, price, desc, features, cta, featured, onClick }) => (
  <div
    className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
      featured ? 'ring-2 ring-[#FF5722] shadow-[0_0_60px_-20px_rgba(255,87,34,0.5)]' : ''
    }`}
    style={{ background: featured ? '#0F172A' : 'rgba(26,31,46,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
  >
    {featured && (
      <div
        className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white rounded-full"
        style={{ background: '#FF5722', boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}
      >
        Most Popular
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-[22px] font-black text-white mb-1 tracking-tight" style={{ textTransform: 'none' }}>
        {tier}
      </h3>
      <p className="text-[11px] text-white/40 font-semibold uppercase tracking-[0.2em] mb-6">{desc}</p>
      <div className="flex items-end gap-1">
        <span className="text-[3rem] font-black text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
          {price}
        </span>
        {price !== 'Custom' && price !== 'Early Access' && (
          <span className="text-white/40 font-semibold text-[12px] mb-2">/mo</span>
        )}
      </div>
    </div>
    <ul className="space-y-3.5 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-[14px] font-medium text-white/70" style={{ textTransform: 'none' }}>
          <CheckCircle size={15} className="shrink-0" style={{ color: featured ? '#FF5722' : '#10B981' }} />
          {f}
        </li>
      ))}
    </ul>
    <button
      onClick={onClick}
      className={`w-full py-4 rounded-2xl text-[12px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] ${
        featured
          ? 'text-white'
          : 'bg-white/6 border border-white/10 text-white hover:bg-white/10'
      }`}
      style={featured ? {
        background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
        boxShadow: '0 4px 20px rgba(255,87,34,0.4)',
      } : {}}
    >
      {cta}
    </button>
  </div>
);

// ── Main LandingPage ─────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stepPaused, setStepPaused] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance "How It Works" steps — respects reduced-motion and hover pause
  useEffect(() => {
    if (prefersReducedMotion || stepPaused) return;
    const timer = setInterval(() => setActiveStep(s => (s + 1) % 4), 3000);
    return () => clearInterval(timer);
  }, [stepPaused]);

  const handleDashboardRedirect = () => {
    const role = user?.role?.toUpperCase();
    if      (role === 'DRIVER')                               navigate('/driver');
    else if (role === 'FACILITY' || role === 'FACILITY_OPERATOR') navigate('/facility');
    else if (role === 'WAREHOUSE')                            navigate('/admin/warehouse');
    else                                                       navigate('/admin');
  };

  const steps = [
    { id: '01', title: 'Sign up in under a minute', desc: 'Create your account, tell us about your fleet, and pick the modules you need. We tailor the dashboard to your operation.', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2000&auto=format&fit=crop' },
    { id: '02', title: 'Add your fleet & drivers', desc: 'Add vehicles, drivers, hubs, and your first delivery notes. Bulk-import from spreadsheets if you already have them.', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop' },
    { id: '03', title: 'Track every trip in real time', desc: 'See where every vehicle is, ETAs, exceptions, and proof-of-delivery as drivers complete stops. No phone-call updates.', image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2000&auto=format&fit=crop' },
    { id: '04', title: 'Grow with data you trust', desc: 'Reconcile payments, spot bottlenecks, and forecast demand. Every metric ties back to a verifiable delivery.', image: 'https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=2000&auto=format&fit=crop' },
  ];

  const currentStep = steps[activeStep];

  return (
    <MarketingLayout>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Gradient mesh background, no Unsplash dependency
      ══════════════════════════════════════════════════════════════════ */}
      <section className="hero-mesh relative overflow-hidden" style={{ paddingTop: 0, marginTop: '-76px' }}>
        {/* Full-height hero container (accounts for fixed nav spacer) */}
        <div className="relative min-h-screen flex flex-col justify-between" style={{ paddingTop: '76px' }}>

          {/* Hero content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
              {/* Left Column: Headline, Description and CTAs */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                {/* Pilot badge */}
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-10 self-start"
                >
                  <div
                    className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="flex h-2 w-2 rounded-full bg-[#FF5722] animate-pulse" aria-hidden="true" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
                      Now onboarding pilot partners
                    </span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                >
                  <h1
                    className="text-[4.5rem] md:text-[6.5rem] lg:text-[7.5rem] font-black text-white leading-[0.88] tracking-[-0.03em] mb-8"
                    style={{ fontFamily: 'var(--font-display)', textTransform: 'none' }}
                  >
                    Logistics,{' '}
                    <br />
                    built for{' '}
                    <span
                      className="font-serif font-medium italic"
                      style={{ color: '#FF7A50', textTransform: 'none', fontFamily: 'var(--font-serif)' }}
                    >
                      Africa.
                    </span>
                  </h1>
                  <p
                    className="text-[18px] md:text-[21px] text-white/60 font-medium leading-relaxed mb-12 max-w-2xl"
                    style={{ textTransform: 'none', letterSpacing: 'normal' }}
                  >
                    One place to manage your fleet, dispatch drivers, and reconcile payments —
                    built for African logistics teams.
                  </p>

                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => isAuthenticated ? handleDashboardRedirect() : navigate('/register')}
                      className="btn-primary-brand !h-14 !px-10 !rounded-xl !text-[13px] justify-center"
                      aria-label="Get started with Shipstack"
                    >
                      Get started free
                      <ArrowRight size={18} />
                    </button>
                    {!isAuthenticated && (
                      <button
                        onClick={() => navigate('/product')}
                        className="btn-ghost !h-14 !px-10 !rounded-xl !text-[13px] justify-center"
                      >
                        See how it works
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Floating KPI cards */}
              <div className="lg:col-span-4 hidden lg:flex flex-col gap-3 items-end">
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col gap-3"
                >
                  {[
                    { icon: Activity, label: 'Fleet nodes active', value: '2,840+', color: '#FF5722' },
                    { icon: MapPin,   label: 'Live trips',          value: '317',    color: '#10B981' },
                    { icon: Zap,      label: 'API latency',         value: '< 25ms', color: '#3B82F6' },
                  ].map((kpi, i) => (
                    <KPICard
                      key={kpi.label}
                      variant="glass-marketing"
                      icon={kpi.icon}
                      label={kpi.label}
                      value={kpi.value}
                      color={kpi.color}
                      index={i}
                      reduceMotion={prefersReducedMotion}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Stat bar */}
          <div className="relative z-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(26,31,46,0.8)', backdropFilter: 'blur(20px)' }}>
            <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/6">
                {[
                  { value: 'Pilot', label: 'Live with first partners' },
                  { value: '< 25ms', label: 'API response time' },
                  { value: '99.99%', label: 'Uptime SLA' },
                  { value: '24/7', label: 'Support during pilot' },
                ].map((stat) => (
                  <div key={stat.label} className="py-8 px-6 md:px-10">
                    <p
                      className="text-[2rem] md:text-[2.5rem] font-black text-white tracking-tight leading-none mb-2"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SOCIAL PROOF — Partner integrations
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 border-b" style={{ background: '#F8FAFC', borderColor: '#F1F5F9' }}>
        <div className="container-responsive">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400 mb-14">
            Building with our first pilot partners — looking for the next.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {[
              { name: 'M-Pesa',       badge: 'Payout Ready',         color: '#10B981' },
              { name: 'ERP Sync',     badge: 'Frappe Integration',    color: '#3B82F6' },
              { name: 'Settlements',  badge: 'Bank-grade',            color: '#8B5CF6' },
              { name: 'Security',     badge: 'Pilot-Verified',        color: '#F59E0B' },
            ].map((partner) => (
              <div key={partner.name} className="flex flex-col items-center gap-2 group">
                <div
                  className="h-12 px-6 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    minWidth: '120px',
                  }}
                >
                  <span
                    className="font-black text-[15px] uppercase tracking-tight text-slate-400 group-hover:text-slate-700 transition-colors"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {partner.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: partner.color }}
                >
                  {partner.badge}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <span
              className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em]"
              style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5722] animate-pulse" aria-hidden="true" />
              Closed pilot — onboarding teams in East and West Africa
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BENTO FEATURES — Core capabilities grid
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32 relative overflow-hidden" style={{ background: '#0B0E16' } as any}>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 70% 30%, rgba(255,87,34,0.08) 0%, transparent 60%)',
          }}
        />
        <div className="container-responsive relative z-10">
          <div className="mb-20">
            <p className="label-brand mb-4">Platform</p>
            <h2
              className="text-[3rem] md:text-[4.5rem] font-black text-white leading-[0.92] tracking-tight mb-6"
              style={{ textTransform: 'none', letterSpacing: '-0.03em', maxWidth: '700px' }}
            >
              Everything you need, nothing you don't.
            </h2>
            <p className="text-[17px] text-white/50 font-medium max-w-xl" style={{ textTransform: 'none' }}>
              The core tools your operations team uses every day — in one fast, offline-capable platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={LayoutDashboard}
              title="Unified dispatch dashboard"
              desc="See every carrier and vehicle from one screen. Plan trips, assign drivers, and watch them happen — live."
              delay={0}
              accent="#FF5722"
              large
            />
            <FeatureCard
              icon={Navigation}
              title="Live GPS tracking"
              desc="Street-level GPS for every vehicle with route history, ETAs, and vehicle health."
              delay={0.05}
              accent="#10B981"
            />
            <FeatureCard
              icon={Wallet}
              title="Automated payouts"
              desc="Pay drivers instantly over M-Pesa, Wave, or bank transfer the moment a trip is reconciled."
              delay={0.1}
              accent="#3B82F6"
            />
            <FeatureCard
              icon={Database}
              title="Multi-hub inventory"
              desc="Track SKUs across warehouses and depots in real time. Full reconciliation with delivery notes."
              delay={0.15}
              accent="#8B5CF6"
            />
            <FeatureCard
              icon={ClipboardCheck}
              title="Proof of delivery"
              desc="Digital signatures, photos, and geo-stamps — collected offline-first on the driver PWA."
              delay={0.2}
              accent="#F59E0B"
            />
            <FeatureCard
              icon={Cog}
              title="Open API & ERP sync"
              desc="Plug Shipstack into your existing SAP, Frappe, Odoo, or custom ERP with our REST API."
              delay={0.25}
              accent="#06B6D4"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32 relative overflow-hidden" style={{ background: '#050810' } as any}>
        <div className="container-responsive relative z-10">
          <div className="text-center mb-20">
            <p className="label-brand mb-4">Comparison</p>
            <h2
              className="text-[3rem] md:text-[4.5rem] font-black text-white mb-4"
              style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
            >
              How we{' '}
              <span
                className="font-serif italic font-medium"
                style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)' }}
              >
                compare.
              </span>
            </h2>
            <p className="text-white/45 font-medium" style={{ textTransform: 'none' }}>
              The honest answer, in one table.
            </p>
          </div>
          <div className="overflow-x-auto pb-8 -mx-4 px-4">
            <table className="w-full min-w-[720px] text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="py-6 px-6 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Capability</th>
                  <th className="py-6 px-6">
                    <div
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-black text-white uppercase tracking-tight"
                      style={{ background: '#FF5722', boxShadow: '0 4px 20px rgba(255,87,34,0.4)' }}
                    >
                      <Layers size={16} />
                      Shipstack
                    </div>
                  </th>
                  <th className="py-6 px-6 text-[14px] font-bold text-white/30 uppercase tracking-tight">Legacy enterprise</th>
                  <th className="py-6 px-6 text-[14px] font-bold text-white/30 uppercase tracking-tight">Spreadsheets</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Response time',        shipstack: '< 250ms',   trad: '2.5s – 5s',     diy: 'N/A'         },
                  { feature: 'Setup time',            shipstack: 'Same day',  trad: '12–24 weeks',   diy: 'Ongoing'     },
                  { feature: 'Live tracking',         shipstack: true,        trad: 'Hourly batch',   diy: 'Phone calls' },
                  { feature: 'M-Pesa integration',   shipstack: true,        trad: 'No',            diy: 'Manual cash' },
                  { feature: 'Demand forecasting',   shipstack: true,        trad: 'Paid add-on',    diy: 'No'          },
                  { feature: 'Uptime SLA',            shipstack: '99.99%',   trad: '99.0%',         diy: 'Best effort' },
                ].map((row, i) => (
                  <tr key={i} className="group">
                    <td
                      className="py-5 px-6 rounded-l-2xl font-semibold text-white/60 text-[14px] transition-colors group-hover:text-white/80"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {row.feature}
                    </td>
                    <td
                      className="py-5 px-6 font-black text-[15px] transition-colors"
                      style={{ background: 'rgba(255,87,34,0.07)', borderTop: '1px solid rgba(255,87,34,0.1)', borderBottom: '1px solid rgba(255,87,34,0.1)', color: '#FF7A50' }}
                    >
                      {typeof row.shipstack === 'boolean'
                        ? <span className="flex items-center gap-2"><CheckCircle size={16} /> Included</span>
                        : <span className="flex items-center gap-2"><CheckCircle size={15} style={{ color: '#FF5722' }} /> {row.shipstack}</span>
                      }
                    </td>
                    <td
                      className="py-5 px-6 text-white/35 text-[14px] font-medium italic transition-colors group-hover:text-white/50"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {row.trad}
                    </td>
                    <td
                      className="py-5 px-6 rounded-r-2xl text-white/35 text-[14px] font-medium italic transition-colors group-hover:text-white/50"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      {row.diy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS — Interactive step carousel
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper
        className="py-32 relative overflow-hidden border-t"
        style={{ background: '#FFFFFF', borderColor: '#F1F5F9' } as any}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 40% 50% at 80% 20%, rgba(255,87,34,0.04) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <div
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start"
            onMouseEnter={() => setStepPaused(true)}
            onMouseLeave={() => setStepPaused(false)}
            onFocus={() => setStepPaused(true)}
            onBlur={() => setStepPaused(false)}
          >
            {/* Left */}
            <div>
              <p className="label-brand mb-4">How it works</p>
              <h2
                className="text-[2.5rem] md:text-[3.5rem] font-black tracking-tight text-slate-900 mb-10 leading-[0.92]"
                style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
              >
                From delivery note to{' '}
                <span
                  className="font-serif italic font-medium"
                  style={{ color: '#FF5722', fontFamily: 'var(--font-serif)', textTransform: 'none' }}
                >
                  final settlement
                </span>{' '}
                — without the spreadsheets.
              </h2>

              {/* Step pills */}
              <div className="flex gap-2.5 mb-10" role="tablist" aria-label="How it works steps">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={i === activeStep}
                    aria-controls={`step-panel-${i}`}
                    onClick={() => { setActiveStep(i); setStepPaused(true); }}
                    className={`h-11 w-11 rounded-xl text-[13px] font-black transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722] ${
                      i === activeStep
                        ? 'text-white shadow-lg'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                    style={i === activeStep ? { background: '#FF5722', boxShadow: '0 4px 16px rgba(255,87,34,0.35)' } : {}}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  id={`step-panel-${activeStep}`}
                  role="tabpanel"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">Step {currentStep.id}</p>
                  <h3
                    className="text-[1.75rem] font-black text-slate-900 mb-4 tracking-tight"
                    style={{ textTransform: 'none', letterSpacing: '-0.015em' }}
                  >
                    {currentStep.title}
                  </h3>
                  <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-lg" style={{ textTransform: 'none' }}>
                    {currentStep.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Auto-advance progress bar */}
              {!prefersReducedMotion && (
                <div className="mt-8 h-[2px] bg-slate-100 rounded-full overflow-hidden w-48" aria-hidden="true">
                  <motion.div
                    key={activeStep}
                    className="h-full rounded-full"
                    style={{ background: '#FF5722' }}
                    initial={{ width: '0%' }}
                    animate={stepPaused ? {} : { width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </div>
              )}
            </div>

            {/* Right: Step photo */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${currentStep.id}`}
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-[4/5]"
              >
                <img
                  src={currentStep.image}
                  alt={`Step ${currentStep.id}: ${currentStep.title}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(11,14,22,0.5) 0%, transparent 50%)' }}
                />
                <div className="absolute bottom-6 left-6 right-6">
                  <div
                    className="inline-flex flex-col px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Step {currentStep.id}</p>
                    <p className="text-[13px] font-bold text-slate-900" style={{ textTransform: 'none' }}>{currentStep.title}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUCT SHOWCASE — Dashboard preview
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32 relative overflow-hidden" style={{ background: '#0B0E16' } as any}>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 50% 50% at 30% 50%, rgba(255,87,34,0.09) 0%, transparent 60%)' }}
        />
        <div className="container-responsive relative z-10">
          <div className="mb-16 max-w-2xl">
            <p className="label-brand mb-4">Product</p>
            <h2
              className="text-[3rem] md:text-[4rem] font-black text-white leading-[0.92] tracking-tight"
              style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
            >
              The actual dashboard. Not a mockup.
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-8 rounded-[3rem] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(255,87,34,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }}
              aria-hidden="true"
            />
            <div className="relative rounded-3xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <React.Suspense fallback={
                <div className="w-full aspect-[16/9] rounded-2xl animate-pulse" style={{ background: 'rgba(26,31,46,0.6)' }} aria-label="Loading dashboard preview" />
              }>
                <DashboardShowcase />
              </React.Suspense>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS — Glassmorphism on dark
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32" style={{ background: '#050810' } as any}>
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
          <div className="mb-20">
            <p className="label-brand mb-4">Pilot feedback</p>
            <h2
              className="text-[3rem] md:text-[4rem] font-black text-white max-w-3xl leading-[0.92] tracking-tight"
              style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
            >
              What the operators{' '}
              <span className="font-serif italic font-medium" style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)', textTransform: 'none' }}>
                piloting Shipstack
              </span>{' '}
              are telling us.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { quote: "Finally a platform that doesn't ignore the complexity of the African last mile. The visibility into driver settlements is exactly what we needed.", author: 'Amara Diallo', role: 'Operations Director', company: 'SwiftRoute Logistics', initial: 'A', color: '#FF5722' },
              { quote: "Shipstack's integration with our existing ERP was seamless. It's the first logistics OS that feels built for scale, not just hype.", author: 'Moussa Keïta', role: 'CTO', company: 'Sahel Freight', initial: 'M', color: '#10B981' },
              { quote: "The early-access support has been incredible. They aren't just selling software — they're helping us refine our entire operational flow.", author: 'Kwame Mensah', role: 'Founder', company: 'Nexus Courier', initial: 'K', color: '#3B82F6' },
              { quote: "Live tracking changed how we run dispatch. We can see every trip and respond before customers even call to ask.", author: 'Naledi Khumalo', role: 'Fleet Manager', company: 'Cape Cargo Co', initial: 'N', color: '#8B5CF6' },
            ].map((t, i) => (
              <motion.div
                key={t.author}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="card-glass flex flex-col h-full"
              >
                {/* Avatar with initial */}
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-[18px] text-white mb-6 shrink-0"
                  style={{ background: `${t.color}20`, border: `1px solid ${t.color}30`, color: t.color }}
                  aria-hidden="true"
                >
                  {t.initial}
                </div>
                <div className="flex gap-0.5 mb-4" aria-label="5 stars">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: t.color }} aria-hidden="true">★</span>
                  ))}
                </div>
                <p
                  className="text-[14px] text-white/70 font-medium leading-relaxed flex-1 mb-6"
                  style={{ textTransform: 'none', letterSpacing: 'normal' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="pt-5 border-t border-white/8">
                  <p className="text-[14px] font-bold text-white leading-none mb-1" style={{ textTransform: 'none' }}>
                    {t.author}
                  </p>
                  <p className="text-[12px] text-white/40 font-medium" style={{ textTransform: 'none' }}>
                    {t.role}, {t.company}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          WHY SHIPSTACK — Feature list + photo
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32 border-t" style={{ background: '#0B0E16', borderColor: 'rgba(255,255,255,0.05)' } as any}>
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
          <div className="mb-16 max-w-3xl">
            <p className="label-brand mb-4">Why Shipstack</p>
            <h2
              className="text-[3rem] md:text-[4rem] font-black text-white leading-[0.92] tracking-tight"
              style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
            >
              Built for how African logistics{' '}
              <span
                className="font-serif italic font-medium"
                style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)', textTransform: 'none' }}
              >
                actually works
              </span>{' '}
              — not how a boardroom imagines it.
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-10">
              {[
                { title: 'African logistics expertise', desc: "We've spent months on the ground in Nairobi and Lagos. The product is shaped by the way operators actually work — not by assumptions from a different market." },
                { title: 'Modern technology', desc: 'Live tracking, automated payouts, multi-region currency support, and a working offline-first driver PWA. Real engineering, not a slideshow.' },
                { title: 'Pilot-partner approach', desc: "We work alongside our first partners to build the right product. You get direct access to the team and your feedback ships fast." },
                { title: 'Transparent pricing', desc: 'Plans you can read in a minute. No setup fees, no hidden integration charges. Pay in M-Pesa, card, or invoice.' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex gap-5"
                >
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 mt-1"
                    style={{ background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.2)' }}
                    aria-hidden="true"
                  >
                    <CheckCircle size={18} style={{ color: '#FF5722' }} />
                  </div>
                  <div>
                    <h3
                      className="text-[17px] font-bold text-white mb-2"
                      style={{ textTransform: 'none', letterSpacing: 'normal' }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[14px] text-white/50 font-medium leading-relaxed" style={{ textTransform: 'none' }}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-square">
              <img
                src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?q=80&w=2000&auto=format&fit=crop"
                alt="Logistics team in motion"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(11,14,22,0.4) 0%, transparent 50%)' }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper id="pricing" className="py-32 border-t" style={{ background: '#F8FAFC', borderColor: '#F1F5F9' } as any}>
        <div className="container-responsive">
          <div className="mb-20 text-center">
            <p className="label-brand mb-4">Pricing</p>
            <h2
              className="text-[3rem] md:text-[4.5rem] font-black text-slate-900 tracking-tight"
              style={{ textTransform: 'none', letterSpacing: '-0.03em' }}
            >
              Simple, honest pricing.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PricingTier
              tier="Pilot"
              price="Early Access"
              desc="For founding partners"
              features={['Co-development support', 'Custom ERP integration', 'White-glove onboarding', 'Priority feature requests']}
              cta="Apply for Pilot"
              onClick={() => navigate('/contact')}
            />
            <PricingTier
              tier="Growth"
              price="$199"
              desc="Most Popular"
              featured
              features={['Advanced telemetry', 'Multi-hub sync', '24/7 Priority support', 'API Access']}
              cta="Request Access"
              onClick={() => navigate('/register')}
            />
            <PricingTier
              tier="Enterprise"
              price="Custom"
              desc="Continental Scale"
              features={['On-premise options', 'Custom compliance rules', 'Dedicated engineering team', 'Unlimited nodes']}
              cta="Book Consultation"
              onClick={() => navigate('/contact')}
            />
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          FAQ + CONTACT
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="py-32 relative overflow-hidden" style={{ background: '#0B0E16' } as any}>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 40% 50% at 20% 60%, rgba(255,87,34,0.06) 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <div className="mb-16">
            <p className="label-brand mb-4">FAQ</p>
            <h2
              className="text-[3rem] md:text-[4rem] font-black text-white leading-[0.92] tracking-tight"
              style={{ textTransform: 'none', letterSpacing: '-0.025em' }}
            >
              Got questions?{' '}
              <span className="font-serif italic font-medium" style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)', textTransform: 'none' }}>
                We're here.
              </span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Contact form */}
            <div
              className="lg:col-span-2 rounded-3xl p-8 border"
              style={{ background: 'rgba(26,31,46,0.6)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <h3 className="text-[18px] font-bold text-white mb-2" style={{ textTransform: 'none' }}>Send us a message</h3>
              <p className="text-[13px] text-white/45 mb-8" style={{ textTransform: 'none' }}>We respond within one business day.</p>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/contact'); }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-brand mb-2 block" htmlFor="faq-name">Name</label>
                    <input
                      id="faq-name"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl text-[14px] font-medium text-white focus:outline-none focus:ring-2 transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'none' }}
                      onFocus={(e) => { e.target.style.borderColor = '#FF5722'; e.target.style.boxShadow = '0 0 0 3px rgba(255,87,34,0.12)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="label-brand mb-2 block" htmlFor="faq-phone">Phone</label>
                    <input
                      id="faq-phone"
                      type="tel"
                      className="w-full px-4 py-3 rounded-xl text-[14px] font-medium text-white focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'none' }}
                      onFocus={(e) => { e.target.style.borderColor = '#FF5722'; e.target.style.boxShadow = '0 0 0 3px rgba(255,87,34,0.12)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-brand mb-2 block" htmlFor="faq-email">Email</label>
                  <input
                    id="faq-email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl text-[14px] font-medium text-white focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = '#FF5722'; e.target.style.boxShadow = '0 0 0 3px rgba(255,87,34,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="label-brand mb-2 block" htmlFor="faq-message">Message</label>
                  <textarea
                    id="faq-message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-[14px] font-medium text-white focus:outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = '#FF5722'; e.target.style.boxShadow = '0 0 0 3px rgba(255,87,34,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" className="w-full btn-primary-brand !rounded-xl justify-center text-[12px] tracking-[0.15em]">
                  Send message <ArrowRight size={15} />
                </button>
              </form>
            </div>

            {/* FAQ accordion */}
            <div className="lg:col-span-3 space-y-1">
              {[
                { q: 'Where is my data stored?', a: "Your data lives in regional Supabase clusters with row-level security. We comply with GDPR, Kenya's DPA, and Nigeria's NDPR." },
                { q: 'How long does setup take?', a: 'Pilot partners are typically up and running within a day. Larger fleets, about a week, with our team alongside you.' },
                { q: 'What kind of support do you offer?', a: 'Pilot partners get direct chat with our team while we shape the product together. Plan-tiered support kicks in as we scale beyond pilot.' },
                { q: 'Do you handle customs clearance?', a: "Cross-border customs is on the roadmap. For now, Shipstack tracks customs documents and timestamps but doesn't file them on your behalf." },
                { q: 'How can I track my shipment?', a: "Every delivery note has a public tracking link your customer can open. Drivers also see status from the driver PWA." },
                { q: 'What if my shipment is lost or damaged?', a: "Exceptions are first-class in Shipstack: report them in-app with a photo, and we flag the affected delivery + a follow-up task automatically." },
              ].map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA — Gradient mesh, no Unsplash
      ══════════════════════════════════════════════════════════════════ */}
      <SectionWrapper className="hero-mesh py-40 relative overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' } as any}>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 60% 70% at 50% 50%, rgba(255,87,34,0.22) 0%, transparent 55%),
              radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,122,80,0.12) 0%, transparent 50%)
            `,
          }}
        />
        <div className="container-responsive relative z-10 text-center">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-4xl mx-auto"
          >
            <p className="label-brand mb-6 justify-center flex" style={{ justifyContent: 'center' }}>Join the first wave</p>
            <h2
              className="text-[4rem] md:text-[6rem] lg:text-[7rem] font-black text-white leading-[0.88] tracking-tight mb-8"
              style={{ textTransform: 'none', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}
            >
              Ready to{' '}
              <span className="font-serif italic font-medium" style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)', textTransform: 'none' }}>
                ship
              </span>
              ?
            </h2>
            <p
              className="text-[18px] md:text-[21px] text-white/55 font-medium mb-14 max-w-2xl mx-auto leading-relaxed"
              style={{ textTransform: 'none', letterSpacing: 'normal' }}
            >
              We're onboarding pilot partners now.
              Be part of the team shaping the future of African logistics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary-brand !h-14 !px-12 !rounded-xl !text-[13px] justify-center w-full sm:w-auto"
                aria-label="Sign up free for Shipstack"
              >
                Sign up free <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="btn-ghost !h-14 !px-12 !rounded-xl !text-[13px] justify-center w-full sm:w-auto"
              >
                Talk to our team
              </button>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.7 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[100] h-12 w-12 rounded-2xl text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{ background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)', boxShadow: '0 6px 24px rgba(255,87,34,0.45)' }}
            aria-label="Back to top"
          >
            <ChevronUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </MarketingLayout>
  );
};

export default LandingPage;
