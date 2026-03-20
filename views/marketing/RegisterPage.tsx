
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { PasswordInput } from '../../packages/ui/PasswordInput';
import { Layers, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, ChevronLeft } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    role: 'ADMIN' as any
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { user, token } = await api.register(formData);
      login(user, token);
      addNotification("Mission Initialized. Proceed to Onboarding.", "success");
      navigate('/onboarding');
    } catch (err: any) {
      addNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg">
            <Layers size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Shipstack</span>
        </Link>
        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand flex items-center gap-2">
           <ChevronLeft size={16} /> Abort Registration
        </Link>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-24 bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
               <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Initialize Your Stack.</h1>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">Manifest your operational hub in seconds. 14-day full professional access included.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commander Name</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Full identity name"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization / Fleet Name</label>
                  <input 
                    type="text" required
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g. Blue Star Logistics"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                  />
               </div>

               <PasswordInput 
                 label="Set Master Password"
                 required
                 showStrength
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 placeholder="••••••••"
               />

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-brand text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-brand/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-10"
               >
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Deploy Base Stack</>}
               </button>
            </form>

            <p className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Already running on Shipstack? <Link to="/login" className="text-brand-accent hover:underline">Sign In Terminal</Link>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-brand items-center justify-center p-20 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-accent/20 via-transparent to-transparent"></div>
           <div className="max-w-md relative z-10">
              <div className="h-20 w-20 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-12 shadow-2xl">
                 <ShieldCheck className="text-brand-accent" size={40} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-8 leading-tight">Your Logistics Data, Secured.</h2>
              <div className="space-y-8">
                 <RegisterBenefit 
                   title="High-Precision Tracking" 
                   desc="Street-level telemetry for every unit in your fleet pool." 
                 />
                 <RegisterBenefit 
                   title="Audit-Grade Compliance" 
                   desc="Permanent manifest and document trails for every manifest." 
                 />
                 <RegisterBenefit 
                   title="Automated Settlement" 
                   desc="Reduce billing disputes with verified proof of delivery." 
                 />
              </div>
           </div>
           <Layers className="absolute -bottom-20 -right-20 text-white/5" size={400} />
        </div>
      </div>
    </div>
  );
};

const RegisterBenefit = ({ title, desc }: any) => (
  <div className="flex gap-4">
    <div className="h-6 w-6 bg-brand-accent/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
       <div className="h-2 w-2 rounded-full bg-brand-accent" />
    </div>
    <div>
       <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{title}</h4>
       <p className="text-xs text-white/40 font-bold leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default RegisterPage;
