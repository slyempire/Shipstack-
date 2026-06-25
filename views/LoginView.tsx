
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { PasswordInput } from '../packages/ui/PasswordInput';
import type { LucideIcon } from 'lucide-react';
import {
  ShieldCheck, Truck, UserCog, WifiOff, AlertCircle, RefreshCw,
  Layers, ArrowLeft, Warehouse, DollarSign, LogIn, ArrowRight,
  MapPin, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KPICard } from '../components/shared/KPICard';
/* ─── Animated mesh background for the dark panel ──────────────────────────*/
const MeshBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    {/* Primary gradient blobs */}
    <div
      className="absolute animate-pulse-glow"
      style={{
        width: '60%', height: '60%',
        top: '5%', left: '-10%',
        background: 'radial-gradient(ellipse, rgba(255,87,34,0.18) 0%, transparent 65%)',
        filter: 'blur(40px)',
      }}
    />
    <div
      className="absolute"
      style={{
        width: '50%', height: '50%',
        bottom: '0%', right: '-5%',
        background: 'radial-gradient(ellipse, rgba(255,122,80,0.12) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'pulse-glow 4s ease-in-out infinite 1.5s',
      }}
    />
    <div
      className="absolute"
      style={{
        width: '35%', height: '35%',
        top: '40%', right: '10%',
        background: 'radial-gradient(ellipse, rgba(255,87,34,0.08) 0%, transparent 60%)',
        filter: 'blur(30px)',
        animation: 'pulse-glow 5s ease-in-out infinite 0.8s',
      }}
    />
    {/* Subtle grid lines */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    {/* Noise grain */}
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        backgroundSize: '192px 192px',
      }}
    />
  </div>
);



/* ─── Demo role tile ─────────────────────────────────────────────────────── */
const DemoTile: React.FC<{
  label: string;
  email: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, email, icon: Icon, color, bgColor, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722]"
  >
    <div
      className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
      style={{ background: bgColor }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 group-hover:text-slate-900 transition-colors leading-none">
      {label}
    </span>
  </button>
);

/* ─── Main LoginView ─────────────────────────────────────────────────────── */
const LoginView: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const { login }                         = useAuthStore();
  const { isOnline, addNotification }     = useAppStore();
  const navigate                          = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('shipstack_remembered_email');
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
  }, []);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    if (name === 'email') {
      if (!value) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Please enter a valid email';
      else delete newErrors.email;
    }
    if (name === 'password') {
      if (!value) newErrors.password = 'Password is required';
      else delete newErrors.password;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redirectByRole = (role: string) => {
    const r = role.toLowerCase();
    if      (r === 'driver')                           navigate('/driver');
    else if (r === 'facility' || r === 'facility_operator') navigate('/facility');
    else if (r === 'client')                           navigate('/client');
    else if (r === 'warehouse')                        navigate('/admin/warehouse');
    else if (r === 'finance' || r === 'finance_manager') navigate('/admin/billing');
    else                                               navigate('/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    if (!validateField('email', email) || !validateField('password', password)) {
      addNotification('Please check your email and password.', 'error');
      return;
    }
    if (rememberMe) localStorage.setItem('shipstack_remembered_email', email);
    else            localStorage.removeItem('shipstack_remembered_email');

    setIsLoading(true);
    try {
      const { user, token } = await api.login(email, password);
      login(user, token);
      addNotification(`Welcome back, ${user.name}`, 'success');
      redirectByRole(user.role);
    } catch (err: any) {
      addNotification(err.message || "Couldn't sign you in. Please try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    if (!isOnline) return;
    setDemoLoading(demoEmail);
    try {
      const { user, token } = await api.login(demoEmail, 'password');
      localStorage.setItem('shipstack_demo_mode', 'true');
      login(user, token);
      addNotification(`Signed in as ${user.role}`, 'info');
      redirectByRole(user.role);
    } catch (err: any) {
      addNotification(err.message || "Couldn't sign you in.", 'error');
    } finally {
      setDemoLoading(null);
    }
  };

  const demoAccounts: Array<{ label: string; email: string; icon: LucideIcon; color: string; bgColor: string }> = [
    { label: 'Admin',    email: 'admin@shipstack.com',    icon: UserCog,    color: '#FF5722', bgColor: 'rgba(255,87,34,0.10)'  },
    { label: 'Driver',   email: 'pilot@shipstack.com',    icon: Truck,      color: '#10B981', bgColor: 'rgba(16,185,129,0.10)'  },
    { label: 'Facility', email: 'hub@shipstack.com',      icon: Warehouse,  color: '#3B82F6', bgColor: 'rgba(59,130,246,0.10)'  },
    { label: 'Finance',  email: 'finance@shipstack.com',  icon: DollarSign, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.10)'  },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F7FA] overflow-hidden text-slate-900 selection:bg-[#FF5722] selection:text-white">

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 text-white px-6 py-3 flex items-center justify-center gap-3 sticky top-0 z-50"
          >
            <WifiOff size={14} />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em]">You're offline — sign-in unavailable</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-screen">

        {/* ── LEFT PANEL: Dark animated side ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="hidden lg:flex w-[46%] xl:w-[42%] relative overflow-hidden flex-col justify-between p-16 xl:p-20"
          style={{ background: '#050810' }}
        >
          <MeshBackground />

          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 group w-fit" aria-label="Back to Shipstack home">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF7A50 100%)', boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}
              >
                <Layers size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[20px] font-black tracking-tight uppercase text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Shipstack
              </span>
            </Link>
          </div>

          {/* Headline */}
          <div className="relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <h1
                className="text-[3.5rem] xl:text-[4rem] font-black text-white tracking-[-0.03em] leading-[0.9] mb-6"
                style={{ fontFamily: 'var(--font-display)', textTransform: 'none' }}
              >
                Welcome<br />
                <span
                  className="font-serif italic font-medium"
                  style={{ color: '#FF7A50', fontFamily: 'var(--font-serif)', textTransform: 'none' }}
                >
                  back.
                </span>
              </h1>
              <p className="text-[14px] font-medium text-white/45 leading-relaxed max-w-xs tracking-normal" style={{ textTransform: 'none' }}>
                Logistics infrastructure for Africa — dispatch, tracking, and settlement in one place.
              </p>
            </motion.div>

            {/* KPI float cards */}
            <div className="space-y-3 max-w-xs">
              <KPICard variant="glass-login" icon={Activity}  label="Active fleet nodes"  value="2,840+"   color="#FF5722"  delay={0.4} />
              <KPICard variant="glass-login" icon={MapPin}    label="Trips live now"       value="317"      color="#10B981"  delay={0.5} />
              <KPICard variant="glass-login" icon={Zap}       label="API response"         value="< 25 ms"  color="#3B82F6"  delay={0.6} />
            </div>
          </div>

          {/* Bottom trust mark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative z-10 flex items-center gap-2"
          >
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] text-white/35 font-medium" style={{ textTransform: 'none' }}>
              Row-level security · GDPR & DPA ready · 99.99% uptime SLA
            </span>
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL: Form ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 xl:px-28 py-12 relative bg-[#F6F7FA]"
        >
          {/* Back link */}
          <Link
            to="/"
            className="absolute top-8 left-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF7A50 100%)' }}
            >
              <Layers size={19} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight uppercase text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              Shipstack
            </span>
          </div>

          <div className="w-full max-w-[420px] mx-auto">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-10"
            >
              <h2
                className="text-[2.25rem] font-black text-slate-900 tracking-[-0.025em] mb-2 leading-tight"
                style={{ fontFamily: 'var(--font-display)', textTransform: 'none' }}
              >
                Sign in
              </h2>
              <p className="text-[13px] text-slate-500 font-medium" style={{ textTransform: 'none' }}>
                Enter your credentials to access your console.
              </p>
            </motion.div>

            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white rounded-2xl border border-slate-200/70 p-8 shadow-[0_4px_32px_rgba(15,23,42,0.07)] mb-6"
            >
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); validateField('email', e.target.value); }}
                    className={`input-field ${errors.email ? 'border-red-400 focus:!border-red-400 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                    placeholder="you@company.com"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-[12px] text-red-500 flex items-center gap-1.5" role="alert">
                      <AlertCircle size={12} /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                    Password
                  </label>
                  <PasswordInput
                    id="login-password"
                    label="Password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); validateField('password', e.target.value); }}
                    className={`input-field ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p id="password-error" className="mt-1.5 text-[12px] text-red-500 flex items-center gap-1.5" role="alert">
                      <AlertCircle size={12} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="h-4 w-4 rounded border-slate-300 transition-all cursor-pointer accent-[#FF5722]"
                    />
                    <span className="text-[12px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-medium text-slate-400 hover:text-[#FF5722] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !isOnline}
                  className="w-full btn-primary-brand !h-13 !rounded-xl mt-2 justify-center text-[12px] tracking-[0.15em] disabled:!opacity-40"
                >
                  {isLoading
                    ? <><RefreshCw className="animate-spin" size={17} /><span>Signing in…</span></>
                    : <><LogIn size={17} /><span>Sign in</span><ArrowRight size={15} /></>
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={() => api.loginWithGoogle()}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 uppercase tracking-[0.12em] hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5722]"
              >
                <img src="https://authjs.dev/img/providers/google.svg" alt="" className="w-4 h-4" aria-hidden="true" />
                Continue with Google
              </button>
            </motion.div>

            {/* Demo accounts */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">
                Try a demo account
              </p>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Demo account quick-access">
                {demoAccounts.map((role) => (
                  <DemoTile
                    key={role.email}
                    label={role.label}
                    email={role.email}
                    icon={role.icon}
                    color={role.color}
                    bgColor={role.bgColor}
                    disabled={!!demoLoading || !isOnline}
                    onClick={() => handleDemoLogin(role.email)}
                  />
                ))}
              </div>
              {demoLoading && (
                <p className="mt-3 text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" /> Signing you in…
                </p>
              )}
            </motion.div>

            {/* Sign up link */}
            <p className="text-center mt-8 text-[12px] text-slate-400 font-medium">
              New to Shipstack?{' '}
              <Link to="/register" className="text-[#FF5722] font-semibold hover:underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
