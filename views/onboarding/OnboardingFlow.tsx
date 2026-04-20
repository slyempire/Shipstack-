
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Zap,
  Layout as LayoutIcon,
  Globe,
  Boxes,
  Lock as LockIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore, useAuthStore, useAuditStore } from '../../store';

const STEPS = [
  { id: 'organization', title: 'Organization Profile', icon: <Building2 className="text-brand" /> },
  { id: 'industry', title: 'Industry Vertical', icon: <Boxes className="text-brand" /> },
  { id: 'governance', title: 'Security & Roles', icon: <ShieldCheck className="text-brand" /> },
  { id: 'deployment', title: 'Initialize Cluster', icon: <Zap className="text-brand" /> }
];

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'GENERAL',
    region: 'East Africa',
    size: '11-50',
    adminEmail: '',
    termsAccepted: false
  });
  const navigate = useNavigate();
  const { setTenant } = useTenantStore();
  const { user, updateUser } = useAuthStore();
  const { logAction } = useAuditStore();

  const handleComplete = () => {
    // Finalize tenant setup
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/ /g, '-'),
      industry: formData.industry as any,
      tier: 'Professional' as any,
      status: 'active' as any,
      enabledModules: ['dashboard', 'fleet', 'analytics'],
      settings: {
        primaryColor: '#10B981',
        currency: 'USD',
        timezone: 'UTC+3'
      },
      createdAt: new Date().toISOString()
    };

    setTenant(newTenant as any);
    updateUser({ isOnboarded: true });
    logAction('tenant_initialized', 'tenant', newTenant.id, { industry: formData.industry });
    navigate('/admin/dashboard');
  };

  const next = () => setCurrentStep(s => s + 1);
  const prev = () => setCurrentStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Background Elements */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-1/2 h-1/2 bg-brand/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]" />
       </div>

       <header className="p-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center italic font-black shadow-xl">S</div>
             <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none">Shipstack <span className="text-brand">Terminal</span></h1>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mr-2">Provisioning Environment</span>
             <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/150?u=${user?.email}`} />
             </div>
          </div>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* Stepper Sidebar */}
             <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9]">Initialize<br/>Your Cluster</h2>
                   <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[240px]"> Configure your operational hub and security governance foundations.</p>
                </div>
                
                <div className="space-y-4 pt-10">
                   {STEPS.map((step, i) => (
                     <div key={step.id} className="flex items-center gap-4 group">
                        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all border-2 ${
                          i === currentStep ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1' :
                          i < currentStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                          'bg-white border-slate-200 text-slate-300'
                        }`}>
                           {i < currentStep ? <CheckCircle2 size={20} /> : step.icon}
                        </div>
                        <div className={i === currentStep ? 'opacity-100' : 'opacity-40'}>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Step 0{i+1}</p>
                           <h4 className={`text-[11px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors ${i === currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.title}
                           </h4>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Content Area */}
             <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-brand/10 border border-brand/5 relative min-h-[500px] flex flex-col">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div 
                      key="step-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 space-y-8"
                    >
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-brand">Organization Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. FarmCare Logistics Ltd"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full text-2xl font-black uppercase placeholder:text-slate-200 border-none outline-none tracking-tighter"
                          />
                          <div className="h-1 w-24 bg-brand rounded-full" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-8 pt-8">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Operational Region</label>
                             <div className="grid grid-cols-1 gap-2">
                                {['East Africa', 'Central Africa', 'Global Hub'].map(r => (
                                  <button
                                    key={r}
                                    onClick={() => setFormData({...formData, region: r})}
                                    className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest text-left transition-all ${formData.region === r ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                  >
                                    {r}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Organization Size</label>
                             <div className="grid grid-cols-1 gap-2">
                                {['1-10 Employees', '11-50 Employees', '50+ Employees'].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setFormData({...formData, size: s})}
                                    className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest text-left transition-all ${formData.size === s ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                  >
                                    {s}
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div 
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 space-y-8"
                    >
                       <div className="space-y-2">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Select Industry DNA</h4>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed">Choose an industry vertical to pre-configure your operational hub with the relevant taxonomy and intelligence hooks.</p>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { id: 'AGRICULTURE', name: 'Agriculture & Farm', icon: '🌱' },
                            { id: 'HEALTHCARE', name: 'Med-Tech & Pharma', icon: '🏥' },
                            { id: 'RETAIL', name: 'B2B Distribution', icon: '📦' },
                            { id: 'E_COMMERCE', name: 'E-Commerce Hero', icon: '🛒' }
                          ].map(ind => (
                            <button
                              key={ind.id}
                              onClick={() => setFormData({...formData, industry: ind.id})}
                              className={`p-6 rounded-3xl border-2 text-left transition-all relative group ${formData.industry === ind.id ? 'bg-brand/5 border-brand shadow-xl' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                            >
                               <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{ind.icon}</span>
                               <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{ind.name}</h5>
                               <p className="text-[9px] font-bold text-slate-400 leading-tight">Includes specialized compliance modules</p>
                               {formData.industry === ind.id && <CheckCircle2 size={16} className="absolute top-6 right-6 text-brand" />}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div 
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10"
                    >
                       <div className="h-24 w-24 bg-brand/10 text-brand rounded-[2.5rem] flex items-center justify-center mb-6">
                          <ShieldCheck size={48} />
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">RBAC System Initialized</h3>
                          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed italic">
                            By deploying this cluster, you agree to govern all operational data under strict Role-Based Access Control protocols. This cannot be bypassed once initialized.
                          </p>
                       </div>
                       <div className="w-full max-w-xs p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <LockIcon size={16} className="text-amber-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Audit Immutability</span>
                          </div>
                          <span className="text-[9px] font-black px-2 py-1 bg-emerald-500 text-white rounded uppercase">Active</span>
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div 
                      key="step-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10"
                    >
                       <div className="relative">
                          <div className="absolute inset-0 bg-brand blur-2xl opacity-20 animate-pulse" />
                          <div className="h-32 w-32 bg-slate-900 text-brand rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10">
                             <Zap size={60} />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Ready for Launch</h3>
                          <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Cluster configuration is complete. Initializing environment for <span className="text-slate-900 font-bold">{formData.name}</span> in {formData.region}.
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture</p>
                             <p className="text-[10px] font-bold text-slate-900 uppercase">Single-Tenant ISO</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Governance</p>
                             <p className="text-[10px] font-bold text-slate-900 uppercase">RBAC Tier 4</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-auto pt-12 flex items-center justify-between">
                   <button 
                     disabled={currentStep === 0}
                     onClick={prev}
                     className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-0 transition-all flex items-center gap-2 hover:bg-slate-100"
                   >
                     <ChevronLeft size={16} /> Back
                   </button>
                   
                   <button 
                     onClick={currentStep === STEPS.length - 1 ? handleComplete : next}
                     className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3 group"
                   >
                     {currentStep === STEPS.length - 1 ? 'Deploy Cluster' : 'Next Protocol'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </div>
       </main>

       <footer className="p-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] relative z-10 italic">
          Shipstack Engineering Systems • Distributed Infrastructure v4.3.0
       </footer>
    </div>
  );
};

export default OnboardingFlow;
