
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { PasswordInput } from '../packages/ui/PasswordInput';
import { ShieldCheck, Truck, Hospital, UserCog, WifiOff, AlertCircle, RefreshCw, Layers, ArrowLeft, Warehouse, DollarSign, LogIn, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { isOnline, addNotification } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('shipstack_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === 'email') {
      if (!value) newErrors.email = 'Email is required';
      else if (!emailRegex.test(value)) newErrors.email = 'Please enter a valid email';
      else delete newErrors.email;
    }

    if (name === 'password') {
      if (!value) newErrors.password = 'Password is required';
      else delete newErrors.password;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;

    const isEmailValid = validateField('email', email);
    const isPasswordValid = validateField('password', password);

    if (!isEmailValid || !isPasswordValid) {
      addNotification("Please check your email and password.", "error");
      return;
    }

    if (rememberMe) {
      localStorage.setItem('shipstack_remembered_email', email);
    } else {
      localStorage.removeItem('shipstack_remembered_email');
    }

    setIsLoading(true);
    try {
      const { user, token } = await api.login(email, password);
      login(user, token);
      addNotification(`Welcome back, ${user.name}`, 'success');
      
      const userRole = user.role.toLowerCase();
      if (userRole === 'driver') navigate('/driver');
      else if (userRole === 'facility' || userRole === 'facility_operator') navigate('/facility');
      else if (userRole === 'client') navigate('/client');
      else if (userRole === 'warehouse') navigate('/admin/warehouse');
      else if (userRole === 'finance' || userRole === 'finance_manager') navigate('/admin/billing');
      else navigate('/admin');
    } catch (err: any) {
      addNotification(err.message || "Couldn't sign you in. Please try again.", 'error');
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
      addNotification(`Signed in as ${user.role}`, 'info');
      
      const userRole = user.role.toLowerCase();
      if (userRole === 'driver') navigate('/driver');
      else if (userRole === 'facility' || userRole === 'facility_operator') navigate('/facility');
      else if (userRole === 'client') navigate('/client');
      else if (userRole === 'warehouse') navigate('/admin/warehouse');
      else if (userRole === 'finance' || userRole === 'finance_manager') navigate('/admin/billing');
      else navigate('/admin');
    } catch (err: any) {
      addNotification(err.message || "Couldn't sign you in.", 'error');
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
    <div className="flex min-h-screen flex-col bg-white overflow-hidden text-slate-900 selection:bg-slate-900 selection:text-white">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 text-white px-6 py-2 flex items-center justify-center gap-2 sticky top-0 z-50 overflow-hidden"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">You're offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Abstract Side Panel */}
        <div className="hidden lg:flex w-[45%] bg-slate-900 relative overflow-hidden items-center justify-center p-24">
           {/* Minimalist Grid Pattern */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           
           <div className="relative z-10 space-y-16 max-w-sm">
              <div className="h-16 w-16 bg-white flex items-center justify-center shadow-3xl">
                 <Layers size={32} className="text-slate-900" />
              </div>
              <div className="space-y-6">
                 <h1 className="text-5xl xl:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85]">Welcome<br/>back.</h1>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-loose">Shipstack &mdash; logistics<br/>infrastructure for Africa.</p>
              </div>
           </div>

           {/* Floating Tactical Element */}
           <div className="absolute -bottom-24 -right-24 h-96 w-96 border border-white/5 rounded-full pointer-events-none" />
           <div className="absolute -bottom-48 -right-48 h-96 w-96 border border-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Login Form Section */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-32 py-24 relative">
          <Link to="/" className="absolute top-12 left-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>

          <div className="w-full max-w-md mx-auto space-y-20">
            <div className="space-y-2 lg:hidden">
                <h2 className="text-5xl font-black tracking-tighter uppercase">Shipstack.</h2>
            </div>

            <div className="space-y-12">
               <div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase mb-2">Sign in.</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Welcome back. Enter your email and password.</p>
               </div>

               <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-4">
                     <div className="relative group">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border-b-2 border-slate-100 py-6 text-2xl font-black outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 tracking-tighter"
                          placeholder="Email"
                        />
                        <label className="absolute -top-4 left-0 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-focus-within:opacity-100 transition-all">Email</label>
                     </div>

                     <div className="relative group">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white border-b-2 border-slate-100 py-6 text-2xl font-black outline-none focus:border-slate-900 transition-all placeholder:text-slate-200 tracking-tighter"
                          placeholder="Password"
                        />
                        <label className="absolute -top-4 left-0 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-focus-within:opacity-100 transition-all">Password</label>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                           type="checkbox" 
                           checked={rememberMe} 
                           onChange={() => setRememberMe(!rememberMe)}
                           className="h-5 w-5 border-2 border-slate-200 checked:bg-slate-900 rounded-none transition-all cursor-pointer accent-slate-900"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Remember me</span>
                     </label>
                     <Link to="/forgot-password" virtual-id="forgot-password-link" className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">Forgot password?</Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isOnline}
                    className="w-full bg-slate-900 text-white h-20 text-sm font-black uppercase tracking-[0.3em] hover:bg-black active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><LogIn size={18} strokeWidth={3} /> Sign in</>}
                  </button>

                  <div className="flex items-center gap-4 py-4">
                     <div className="flex-1 h-px bg-slate-100" />
                     <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">Or continue with</span>
                     <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <button
                    type="button"
                    onClick={() => api.loginWithGoogle()}
                    className="w-full h-20 border-2 border-slate-100 flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] hover:border-slate-900 transition-all active:scale-[0.98]"
                  >
                    <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                    Continue with Google
                  </button>
               </form>
            </div>

            <div className="space-y-8 pt-12 border-t border-slate-50">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200">Try a demo account</h4>
                  <div className="flex gap-1">
                     <div className="h-1 w-4 bg-slate-900" />
                     <div className="h-1 w-2 bg-slate-100" />
                  </div>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Admin', email: 'admin@shipstack.com', icon: UserCog },
                    { label: 'Pilot', email: 'pilot@shipstack.com', icon: Truck },
                    { label: 'Facility', email: 'hub@shipstack.com', icon: Warehouse },
                    { label: 'Finance', email: 'finance@shipstack.com', icon: DollarSign }
                  ].map((role) => (
                    <button 
                      key={role.email}
                      onClick={() => handleDemoLogin(role.email)}
                      className="p-4 border border-slate-100 hover:border-slate-900 transition-all group flex flex-col items-center gap-3"
                    >
                       <role.icon size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                       <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-900 transition-colors">{role.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="text-center">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  New to Shipstack? <Link to="/register" className="text-slate-900 hover:underline">Create an account</Link>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
