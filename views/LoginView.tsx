
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { api } from '../api';
import { PasswordInput } from '../packages/ui/PasswordInput';
import { ShieldCheck, Truck, Hospital, UserCog, WifiOff, AlertCircle, RefreshCw, Layers, ArrowLeft, Warehouse, DollarSign, LogIn } from 'lucide-react';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { isOnline, addNotification } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    setIsLoading(true);
    try {
      const { user, token } = await api.login(email, password);
      login(user, token);
      addNotification(`Welcome back, ${user.name}`, 'success');
      
      if (user.role === 'DRIVER') navigate('/driver');
      else if (user.role === 'FACILITY') navigate('/facility');
      else if (user.role === 'CLIENT') navigate('/client');
      else if (user.role === 'WAREHOUSE') navigate('/admin/warehouse');
      else if (user.role === 'FINANCE') navigate('/admin/billing');
      else navigate('/admin');
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
      login(user, token);
      addNotification(`Demo session started as ${user.role}`, 'info');
      if (user.role === 'DRIVER') navigate('/driver');
      else if (user.role === 'FACILITY') navigate('/facility');
      else if (user.role === 'CLIENT') navigate('/client');
      else if (user.role === 'WAREHOUSE') navigate('/admin/warehouse');
      else if (user.role === 'FINANCE') navigate('/admin/billing');
      else navigate('/admin');
    } catch (err: any) {
      addNotification(err.message || 'Authentication failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Control Tower (Admin)', email: 'admin@shipstack.com', icon: UserCog, color: 'bg-slate-100 text-brand' },
    { label: 'Pilot Terminal (Driver)', email: 'pilot@shipstack.com', icon: Truck, color: 'bg-brand-accent text-white' },
    { label: 'Shipstack Hub (Facility)', email: 'hub@shipstack.com', icon: Hospital, color: 'bg-slate-100 text-brand' },
    { label: 'Warehouse Manager', email: 'warehouse@shipstack.com', icon: Warehouse, color: 'bg-amber-100 text-amber-600' },
    { label: 'Finance Officer', email: 'finance@shipstack.com', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {!isOnline && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50">
          <WifiOff size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Offline Buffer Active</span>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-24 relative">
          <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-colors">
            <ArrowLeft size={14} /> Home Page
          </Link>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-16 w-16 rounded-[24px] bg-brand text-white flex items-center justify-center shadow-2xl">
                 <Layers size={32} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase font-display">Shipstack</h2>
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">The Operating System for African Logistics</p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
            <form className="space-y-6" onSubmit={handleLogin}>
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

              <PasswordInput 
                label="Security Pin"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={isLoading || !isOnline}
                className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Initialize Stack'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!isOnline) return;
                  setIsLoading(true);
                  try {
                    const { user, token } = await api.loginWithGoogle();
                    login(user, token);
                    addNotification(`Welcome back, ${user.name}`, 'success');
                    if (user.role === 'DRIVER') navigate('/driver');
                    else if (user.role === 'FACILITY') navigate('/facility');
                    else if (user.role === 'CLIENT') navigate('/client');
                    else if (user.role === 'WAREHOUSE') navigate('/admin/warehouse');
                    else if (user.role === 'FINANCE') navigate('/admin/billing');
                    else navigate('/admin');
                  } catch (err: any) {
                    addNotification(err.message || 'Google Authentication failed.', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading || !isOnline}
                className="w-full bg-white text-slate-900 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] border-2 border-slate-100 shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Login with Google
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@shipstack.com')}
                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-brand transition-colors"
              >
                Skip to Dashboard (Demo Mode)
              </button>
            </form>

            <div className="mt-16">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest text-slate-300"><span className="bg-white px-4">Instant Sandbox Access</span></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {demoLogins.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.label}
                      onClick={() => handleDemoLogin(demo.email)}
                      className="flex w-full items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-brand-accent/20 transition-all text-left group"
                    >
                      <div className={`p-4 rounded-xl transition-transform group-active:scale-90 ${demo.color}`}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{demo.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{demo.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex flex-1 bg-brand items-center justify-center p-20 relative overflow-hidden">
           <img 
             src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
             alt="Logistics" 
             className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
             referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand/80 to-transparent"></div>
           <div className="max-w-md text-center relative z-10">
              <div className="h-32 w-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-12 backdrop-blur-3xl border border-white/10">
                 <ShieldCheck className="text-brand-accent" size={64} />
              </div>
              <h1 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter leading-none font-display">The Operating System.</h1>
              <p className="text-white/40 text-lg font-medium leading-relaxed uppercase tracking-widest text-sm text-center">
                Dispatch. Track. Deliver. Settle.<br/>The Northern Corridor, digitized.
              </p>
           </div>
           {/* Conceptual layers graphic */}
           <div className="absolute bottom-0 right-0 p-10 opacity-10">
              <Layers size={400} className="text-white" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
