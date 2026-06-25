
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { IndustryType } from '../../types';
import { PasswordInput } from '../../packages/ui/PasswordInput';
import { Layers, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: 'GENERAL' as IndustryType,
    password: '',
    confirmPassword: '',
    role: 'tenant_admin' as any
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    switch (name) {
      case 'name':
        if (!value) newErrors.name = 'Name is required';
        else delete newErrors.name;
        break;
      case 'email':
        if (!value) newErrors.email = 'Email is required';
        else if (!emailRegex.test(value)) newErrors.email = 'Please enter a valid email';
        else delete newErrors.email;
        break;
      case 'password':
        if (value.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else delete newErrors.password;
        break;
      case 'confirmPassword':
        if (value !== formData.password) newErrors.confirmPassword = "Passwords don't match";
        else delete newErrors.confirmPassword;
        break;
      case 'company':
        if (!value) newErrors.company = 'Company name is required';
        else delete newErrors.company;
        break;
    }
    setErrors(newErrors);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(formData.password);

  const handleNext = () => {
    if (step === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const stepErrors: Record<string, string> = {};

      if (!formData.name) stepErrors.name = "Name is required";
      if (!emailRegex.test(formData.email)) stepErrors.email = "Please enter a valid email";
      if (formData.password.length < 8) stepErrors.password = "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = "Passwords don't match";

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        addNotification("Please check the fields below and try again.", "error");
        return;
      }
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company) {
      setErrors(prev => ({ ...prev, company: 'Organization name is required' }));
      return;
    }
    if (!agreedToTerms) {
      addNotification("Please accept the terms of service to proceed.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { user, token } = await api.register({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        password: formData.password,
        role: formData.role
      });
      login(user, token);
      addNotification("Account created. Let's set you up.", "success");
      navigate('/onboarding');
    } catch (err: any) {
      addNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="marketing-surface min-h-screen bg-white flex flex-col font-sans text-slate-900 overflow-hidden">
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
           <ChevronLeft size={16} /> Cancel
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
              className="mb-8"
            >
               <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 w-12 rounded-full bg-brand" />
                  <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-brand' : 'bg-slate-100'}`} />
               </div>
               <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                 {step === 1 ? 'Create your account.' : 'About your company.'}
               </h1>
               <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                 {step === 1 ? 'Two quick steps to get you up and running.' : 'Tell us about your logistics operation.'}
               </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                        {errors.name && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">{errors.name}</span>}
                      </div>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => {
                          setFormData({...formData, name: e.target.value});
                          if (errors.name) validateField('name', e.target.value);
                        }}
                        onBlur={e => validateField('name', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 outline-none transition-all ${errors.name ? 'border-red-100 focus:border-red-200' : 'border-slate-100 focus:border-brand-accent'}`}
                      />
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Email</label>
                        {errors.email && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">{errors.email}</span>}
                      </div>
                      <input 
                        type="email" required
                        value={formData.email}
                        onChange={e => {
                          setFormData({...formData, email: e.target.value});
                          if (errors.email) validateField('email', e.target.value);
                        }}
                        onBlur={e => validateField('email', e.target.value)}
                        placeholder="john@logistics.com"
                        className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 outline-none transition-all ${errors.email ? 'border-red-100 focus:border-red-200' : 'border-slate-100 focus:border-brand-accent'}`}
                      />
                   </div>

                   <div className="space-y-4">
                      <PasswordInput
                        label="Password"
                        required
                        value={formData.password}
                        error={errors.password}
                        onChange={e => {
                          setFormData({...formData, password: e.target.value});
                          if (errors.password) validateField('password', e.target.value);
                          if (errors.confirmPassword) validateField('confirmPassword', formData.confirmPassword);
                        }}
                        onBlur={e => validateField('password', e.target.value)}
                        placeholder="••••••••"
                      />
                      
                      {formData.password && (
                        <div className="px-1 space-y-2">
                           <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                              <span className="text-slate-400 text-[10px]">Password strength</span>
                              <span className={strength < 50 ? 'text-red-500' : strength < 100 ? 'text-amber-500' : 'text-emerald-500'}>
                                 {strength < 50 ? 'Weak' : strength < 100 ? 'Good' : 'Strong'}
                              </span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${strength < 50 ? 'bg-red-500' : strength < 100 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${strength}%` }}
                              />
                           </div>
                        </div>
                      )}

                      <PasswordInput
                        label="Confirm password"
                        required
                        value={formData.confirmPassword}
                        error={errors.confirmPassword}
                        onChange={e => {
                          setFormData({...formData, confirmPassword: e.target.value});
                          if (errors.confirmPassword) validateField('confirmPassword', e.target.value);
                        }}
                        onBlur={e => validateField('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                   </div>

                   <motion.button 
                     onClick={handleNext}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-10"
                   >
                      Continue <ArrowRight size={20} />
                   </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister}
                  className="space-y-6"
                >
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Name</label>
                        {errors.company && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">{errors.company}</span>}
                      </div>
                      <input 
                        type="text" required
                        value={formData.company}
                        onBlur={e => validateField('company', e.target.value)}
                        onChange={e => {
                          setFormData({...formData, company: e.target.value});
                          if (errors.company) validateField('company', e.target.value);
                        }}
                        placeholder="e.g. Blue Star Logistics"
                        className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 outline-none transition-all ${errors.company ? 'border-red-100 focus:border-red-200' : 'border-slate-100 focus:border-brand-accent'}`}
                      />
                   </div>

                   <div className="space-y-6 pt-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <span 
                          onClick={() => setAgreedToTerms(!agreedToTerms)}
                          className={`mt-1 h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 ${agreedToTerms ? 'bg-brand border-brand text-white shadow-lg' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}
                        >
                          {agreedToTerms && <CheckCircle2 size={16} strokeWidth={4} />}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-tight pt-1">
                          By creating an account, you agree to our <span className="text-brand">Terms of Service</span> and <span className="text-brand">Privacy Policy</span>.
                        </span>
                      </label>
                   </div>


                   <div className="flex gap-4 mt-8">
                      <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 px-6 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all"
                      >
                         Back
                      </button>
                      <motion.button 
                        type="submit"
                        disabled={isLoading || !agreedToTerms}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-[2] bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-brand/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                      >
                         {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Create account</>}
                      </motion.button>
                   </div>
                </motion.form>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest space-y-4"
            >
               <div>Already have an account? <Link to="/login" className="text-brand-accent hover:underline">Sign in</Link></div>
               <div className="pt-2">Want to look around first? <Link to="/login" className="text-slate-500 hover:text-brand underline decoration-brand/30 underline-offset-4 transition-colors">Try the demo</Link></div>
            </motion.div>
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
                Your Logistics Data, Secured.
              </motion.h2>
              <div className="space-y-8">
                 <RegisterBenefit
                   index={0}
                   title="Live fleet tracking"
                   desc="Street-level GPS for every vehicle, with route history and ETAs."
                 />
                 <RegisterBenefit
                   index={1}
                   title="Audit-ready records"
                   desc="Every delivery note, signature, and document stored automatically."
                 />
                 <RegisterBenefit
                   index={2}
                   title="Faster invoicing"
                   desc="Cut billing disputes with verified proof of delivery."
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
       <span className="text-xs text-white/40 font-bold leading-relaxed block">{desc}</span>
    </div>
  </motion.div>
);

export default RegisterPage;
