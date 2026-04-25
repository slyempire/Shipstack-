
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { PasswordInput } from '../packages/ui/PasswordInput';
import { ShieldCheck, Truck, Hospital, UserCog, WifiOff, RefreshCw, Layers, ArrowLeft, Warehouse, DollarSign, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Screen = 'login' | 'forgot' | 'forgot-sent';

const LoginView: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { isOnline, addNotification } = useAppStore();
  const navigate = useNavigate();

  const redirectAfterLogin = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'driver') navigate('/driver');
    else if (r === 'facility' || r === 'facility_operator') navigate('/facility');
    else if (r === 'client') navigate('/client');
    else if (r === 'warehouse') navigate('/admin/warehouse');
    else if (r === 'finance' || r === 'finance_manager') navigate('/admin/billing');
    else navigate('/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addNotification("Please enter a valid email address.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const { user, token } = await api.login(email, password);
      login(user, token);
      addNotification(`Welcome back, ${user.name}`, 'success');
      redirectAfterLogin(user.role);
    } catch (err: any) {
      addNotification(err.message || 'Authentication failed. Check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    if (!isOnline) return;
    setIsLoading(true);
    try {
      const { user, token } = await api.login(demoEmail, 'password');
      localStorage.setItem('shipstack_demo_mode', 'true');
      login(user, token);
      addNotification(`Demo session started as ${user.role}`, 'info');
      redirectAfterLogin(user.role);
    } catch (err: any) {
      addNotification(err.message || 'Authentication failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      addNotification("Please enter a valid email address.", "error");
      return;
    }
    setIsLoading(true);
    try {
      await api.requestPasswordReset(resetEmail);
      setScreen('forgot-sent');
    } catch (err: any) {
      addNotification(err.message || 'Failed to send reset email. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Control Tower (Admin)', email: 'admin@shipstack.com', icon: UserCog, color: 'bg-slate-100 text-brand' },
    { label: 'Driver Terminal', email: 'pilot@shipstack.com', icon: Truck, color: 'bg-brand-accent text-white' },
    { label: 'Shipstack Hub (Facility)', email: 'hub@shipstack.com', icon: Hospital, color: 'bg-slate-100 text-brand' },
    { label: 'Warehouse Manager', email: 'warehouse@shipstack.com', icon: Warehouse, color: 'bg-slate-100 text-slate-600' },
    { label: 'Finance Officer', email: 'finance@shipstack.com', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50 overflow-hidden"
          >
            <WifiOff size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Offline Buffer Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col lg:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-24 relative"
        >
          <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">
            <ArrowLeft size={14} /> Home Page
          </Link>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-4 mb-12"
            >
              <div className="h-16 w-16 rounded-[24px] bg-brand text-white flex items-center justify-center shadow-2xl">
                 <Layers size={32} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase font-display">Shipstack</h2>
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">The Operating System for African Logistics</p>
              </div>
            </motion.div>
          </div>

          <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
            <AnimatePresence mode="wait">

              {/* LOGIN SCREEN */}
              {screen === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  onSubmit={handleLogin}
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator ID / Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-slate-900 font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                      placeholder="name@shipstack.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <PasswordInput
                      label="Security Pin"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setResetEmail(email); setScreen('forgot'); }}
                        className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !isOnline}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Initialize Stack'}
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!isOnline) return;
                      setIsLoading(true);
                      try {
                        const { user, token } = await api.loginWithGoogle();
                        login(user, token);
                        addNotification(`Welcome back, ${user.name}`, 'success');
                        redirectAfterLogin(user.role);
                      } catch (err: any) {
                        addNotification(err.message || 'Google Authentication failed.', 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || !isOnline}
                    className="w-full bg-white text-slate-900 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] border-2 border-slate-100 shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                    Login with Google
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@shipstack.com')}
                    className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-brand transition-colors"
                  >
                    Skip to Dashboard (Demo Mode)
                  </button>
                </motion.form>
              )}

              {/* FORGOT PASSWORD SCREEN */}
              {screen === 'forgot' && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  onSubmit={handleForgotPassword}
                >
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => setScreen('login')}
                      className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors mb-6"
                    >
                      <ArrowLeft size={12} /> Back to Login
                    </button>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reset Password</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Enter your email and we'll send a reset link.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-slate-900 font-bold focus:border-brand-accent outline-none transition-all placeholder:text-slate-300"
                      placeholder="name@company.com"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Send Reset Link'}
                  </motion.button>
                </motion.form>
              )}

              {/* CONFIRMATION SCREEN */}
              {screen === 'forgot-sent' && (
                <motion.div
                  key="forgot-sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-6 py-8"
                >
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle size={40} className="text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Check Your Inbox</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      We sent a reset link to<br />
                      <span className="font-black text-slate-600">{resetEmail}</span>.<br />
                      The link expires in 60 minutes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setScreen('login'); setResetEmail(''); }}
                    className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-brand transition-colors"
                  >
                    Back to Login
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Demo logins — only on the main login screen */}
            {screen === 'login' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-16"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest text-slate-300"><span className="bg-white px-4">Instant Sandbox Access</span></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {demoLogins.map((demo, index) => {
                    const Icon = demo.icon;
                    return (
                      <motion.button
                        key={demo.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        whileHover={{ x: 5, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                        onClick={() => handleDemoLogin(demo.email)}
                        className="flex w-full items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-white hover:border-brand-accent/20 transition-all text-left group"
                      >
                        <div className={`p-4 rounded-xl transition-transform group-active:scale-90 ${demo.color}`}>
                          <Icon size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{demo.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{demo.email}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-1 bg-brand items-center justify-center p-20 relative overflow-hidden"
        >
           <img
             src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
             alt="Logistics"
             className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
             referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand/80 to-transparent"></div>
           <div className="max-w-md text-center relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
                className="h-32 w-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-12 backdrop-blur-3xl border border-white/10"
              >
                 <ShieldCheck className="text-brand-accent" size={64} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-5xl font-black text-white mb-8 uppercase tracking-tighter leading-none font-display"
              >
                The Operating System.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-white/40 text-lg font-medium leading-relaxed uppercase tracking-widest text-sm text-center"
              >
                Dispatch. Track. Deliver. Settle.<br/>The Northern Corridor, digitized.
              </motion.p>
           </div>
           <motion.div
             animate={{
               rotate: [0, 5, 0, -5, 0],
               scale: [1, 1.05, 1, 1.05, 1]
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute bottom-0 right-0 p-10 opacity-10"
           >
              <Layers size={400} className="text-white" />
           </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
