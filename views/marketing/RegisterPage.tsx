
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { PasswordInput } from '../../packages/ui/PasswordInput';
import { Layers, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    role: 'tenant_admin' as any
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addNotification("Invalid email format. Please check your entry.", "error");
      return;
    }

    if (formData.password.length < 8) {
      addNotification("Password must be at least 8 characters long.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification("Passwords do not match. Please re-enter.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { user, token } = await api.register(formData);
      login(user, token);
      addNotification("Account created! Let's set things up.", "success");
      navigate('/onboarding');
    } catch (err: any) {
      addNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 overflow-hidden">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full"
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
            <Layers size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Shipstack</span>
        </Link>
        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand flex items-center gap-2">
           <ChevronLeft size={16} /> Back to Home
        </Link>
      </motion.nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-24 bg-white"
        >
          <div className="max-w-md mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-12"
            >
               <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Create Your Account.</h1>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">Get started in seconds. Full access included — no credit card required.</p>
            </motion.div>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              onSubmit={handleRegister} 
              className="space-y-6"
            >
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Amara Osei"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company or Business Name</label>
                  <input 
                    type="text" required
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Blue Star Logistics"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <PasswordInput
                 label="Password"
                 required
                 showStrength
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 placeholder="••••••••"
               />

               <PasswordInput
                 label="Confirm Password"
                 required
                 value={formData.confirmPassword}
                 onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                 placeholder="••••••••"
                 className={formData.confirmPassword && formData.confirmPassword !== formData.password ? 'border-red-300 focus:border-red-400' : ''}
               />
               {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Passwords do not match</p>
               )}

               <motion.button 
                 type="submit"
                 disabled={isLoading}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-brand/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-10"
               >
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Create Account</>}
               </motion.button>
            </motion.form>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
               Already have an account? <Link to="/login" className="text-brand-accent hover:underline">Sign in</Link>
            </motion.p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-1 bg-brand items-center justify-center p-20 relative overflow-hidden"
        >
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-accent/20 via-transparent to-transparent"></div>
           <div className="max-w-md relative z-10">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
                className="h-20 w-20 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-12 shadow-2xl"
              >
                 <ShieldCheck className="text-brand-accent" size={40} />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-4xl font-black text-white uppercase tracking-tighter mb-8 leading-tight"
              >
                Trusted by operators across Africa.
              </motion.h2>
              <div className="space-y-8">
                 <RegisterBenefit
                   index={0}
                   title="Live GPS Tracking"
                   desc="See every driver and delivery on a live map, updated in real time."
                 />
                 <RegisterBenefit
                   index={1}
                   title="Automatic Proof of Delivery"
                   desc="Signatures, photos, and delivery records stored securely for every drop."
                 />
                 <RegisterBenefit
                   index={2}
                   title="M-Pesa & Card Payments"
                   desc="Accept mobile money, cards, and bank transfers — built for Africa."
                 />
              </div>
           </div>
           <motion.div
             animate={{ 
               rotate: [0, -5, 0, 5, 0],
               scale: [1, 1.05, 1, 1.05, 1]
             }}
             transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
             className="absolute -bottom-20 -right-20 text-white/5"
           >
             <Layers size={400} />
           </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const RegisterBenefit = ({ title, desc, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.8 + (index * 0.1), duration: 0.6 }}
    className="flex gap-4"
  >
    <div className="h-6 w-6 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
       <div className="h-2 w-2 rounded-full bg-brand-accent" />
    </div>
    <div>
       <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{title}</h4>
       <p className="text-xs text-white/40 font-bold leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

export default RegisterPage;
