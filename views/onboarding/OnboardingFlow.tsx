
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
  Lock as LockIcon,
  Sprout,
  Activity,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Box,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore, useAuthStore, useAuditStore } from '../../store';

const STEPS = [
  { id: 'organization', title: 'Organization Profile', icon: <Building2 className="text-brand" /> },
  { id: 'industry', title: 'Industry DNA', icon: <Boxes className="text-brand" /> },
  { id: 'pricing', title: 'Service Plan', icon: <BarChart3 className="text-brand" /> },
  { id: 'governance', title: 'Security & Roles', icon: <ShieldCheck className="text-brand" /> },
  { id: 'deployment', title: 'Initialize Cluster', icon: <Zap className="text-brand" /> }
];

const INDUSTRIES = [
  { id: 'AGRICULTURE', name: 'Agriculture & Farm', icon: <Sprout className="text-brand" /> },
  { id: 'HEALTHCARE', name: 'Med-Tech & Pharma', icon: <Activity className="text-blue-500" /> },
  { id: 'RETAIL', name: 'B2B Distribution', icon: <ShoppingBag className="text-amber-500" /> },
  { id: 'E_COMMERCE', name: 'E-Commerce Hero', icon: <ShoppingCart className="text-emerald-500" /> }
];

const PLANS = [
  { 
    id: 'STARTER', 
    name: 'Starter', 
    price: 'Free', 
    icon: <Box size={24} />,
    description: 'Perfect for small fleets just getting started.',
    features: ['3 Vehicles', '50 Shipments/mo', 'Basic Analytics', 'Standard Support']
  },
  { 
    id: 'GROWTH', 
    name: 'Growth', 
    price: '$99', 
    icon: <TrendingUp size={24} />,
    description: 'Scale your operations with unlimited growth.',
    features: ['20 Vehicles', 'Unlimited Shipments', 'Real-time Tracking', 'Priority Support']
  },
  { 
    id: 'SCALE', 
    name: 'Scale', 
    price: '$249', 
    icon: <BarChart3 size={24} />,
    description: 'Advanced features for large-scale distribution.',
    features: ['100 Vehicles', 'AI Route Optimization', 'Custom Reporting', '24/7 Support']
  },
  { 
    id: 'ENTERPRISE', 
    name: 'Enterprise', 
    price: 'Custom', 
    icon: <Zap size={24} />,
    description: 'Bespoke infrastructure for global leaders.',
    features: ['Unlimited Vehicles', 'Dedicated Infrastructure', 'SLA Guarantee', 'Dedicated Manager']
  }
];

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'GENERAL',
    plan: 'GROWTH',
    region: 'East Africa',
    size: '11-50',
    adminEmail: '',
    termsAccepted: false
  });
  const navigate = useNavigate();
  const setTenant = useTenantStore(state => state.setTenant);
  const { user, updateUser } = useAuthStore(state => ({
    user: state.user,
    updateUser: state.updateUser
  }));
  const logAction = useAuditStore(state => state.logAction);

  const handleComplete = () => {
    // Finalize tenant setup
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/ /g, '-'),
      industry: formData.industry as any,
      plan: formData.plan as any,
      status: 'ACTIVE' as any,
      enabledModules: ['dashboard', 'dispatch', 'fleet', 'analytics'],
      settings: {
        primaryColor: '#0F2A44',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        onboardingCompleted: true
      },
      createdAt: new Date().toISOString()
    };

    setTenant(newTenant as any);
    updateUser({ isOnboarded: true });
    logAction('TENANT_INITIALIZED', 'system', newTenant.id, { industry: formData.industry, plan: formData.plan });
    navigate('/admin/dashboard');
  };

  const next = () => {
    if (currentStep === 0 && !formData.name) return;
    setCurrentStep(s => s + 1);
  };
  const prev = () => setCurrentStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
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
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Provisioning Node</p>
                <p className="text-[12px] font-black text-slate-900 leading-none">ALPHA-TER-04</p>
             </div>
             <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm flex items-center justify-center p-0.5">
                <img className="rounded-lg h-full w-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" />
             </div>
          </div>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* Stepper Sidebar */}
             <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                   <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-[0.85]">Provision<br/>New Cluster</h2>
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[240px] uppercase tracking-wider"> Configure architectural foundations and operational DNA for your logistics grid.</p>
                </div>
                
                <div className="space-y-6 pt-10">
                   {STEPS.map((step, i) => (
                     <div key={step.id} className="flex items-center gap-4 group">
                        <div className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all border-2 ${
                          i === currentStep ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-110 translate-x-1' :
                          i < currentStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                          'bg-white border-slate-200 text-slate-300'
                        }`}>
                           {i < currentStep ? <CheckCircle2 size={22} /> : React.cloneElement(step.icon as React.ReactElement, { size: 22 })}
                        </div>
                        <div className={`transition-all ${i === currentStep ? 'opacity-100' : 'opacity-40'}`}>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Step 0{i+1}</p>
                           <h4 className={`text-[12px] font-black uppercase tracking-tight whitespace-nowrap transition-colors ${i === currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                              {step.title}
                           </h4>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Content Area */}
             <div className="lg:col-span-8 bg-white rounded-[4rem] p-12 shadow-2xl shadow-brand/10 border border-slate-100 relative min-h-[600px] flex flex-col">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div 
                      key="step-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 space-y-12"
                    >
                       <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-widest text-brand">Organization Registry</label>
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Enter Legal Entity Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full text-4xl font-black uppercase placeholder:text-slate-100 border-none outline-none tracking-tighter text-slate-900"
                          />
                          <div className="h-1.5 w-32 bg-brand rounded-full" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-12 pt-8">
                          <div className="space-y-6">
                             <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                                <Globe size={14} /> Operational Region
                             </label>
                             <div className="grid grid-cols-1 gap-3">
                                {['East Africa', 'Central Africa', 'South Africa', 'Pan-African HUB'].map(r => (
                                  <button
                                    key={r}
                                    onClick={() => setFormData({...formData, region: r})}
                                    className={`px-6 py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest text-left transition-all ${formData.region === r ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white'}`}
                                  >
                                    {r}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-6">
                             <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 italic">
                                <Users size={14} /> Organization Size
                             </label>
                             <div className="grid grid-cols-1 gap-3">
                                {['1-10 Units', '11-50 Units', '50-100 Units', 'Enterprise 100+'].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setFormData({...formData, size: s})}
                                    className={`px-6 py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest text-left transition-all ${formData.size === s ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white'}`}
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
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Industry Vertical DNA</h4>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Choose a vertical to pre-configure compliance, unit taxonomy, and security hooks.</p>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {INDUSTRIES.map(ind => (
                            <button
                              key={ind.id}
                              onClick={() => setFormData({...formData, industry: ind.id})}
                              className={`p-8 rounded-[2.5rem] border-2 text-left transition-all relative group ${formData.industry === ind.id ? 'bg-brand/5 border-brand shadow-xl' : 'bg-white border-slate-50 hover:border-slate-200 shadow-sm'}`}
                            >
                               <div className="p-4 rounded-2xl bg-slate-50 w-fit mb-6 group-hover:scale-110 transition-transform">
                                  {React.cloneElement(ind.icon as React.ReactElement, { size: 28 })}
                               </div>
                               <h5 className="text-[13px] font-black uppercase tracking-tight text-slate-900 mb-1">{ind.name}</h5>
                               <p className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-wider">Includes specialized {ind.id.toLowerCase()} logic</p>
                               {formData.industry === ind.id && (
                                 <div className="absolute top-8 right-8 h-8 w-8 bg-brand text-white rounded-full flex items-center justify-center shadow-lg">
                                    <Check size={16} strokeWidth={4} />
                                 </div>
                               )}
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
                      className="flex-1 space-y-8"
                    >
                       <div className="space-y-2">
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Select Service Level</h4>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Choose the throughput and processing power required for your fleet.</p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {PLANS.map(plan => (
                            <button
                              key={plan.id}
                              onClick={() => setFormData({...formData, plan: plan.id})}
                              className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative group flex flex-col gap-4 ${formData.plan === plan.id ? 'bg-brand/5 border-brand shadow-xl ring-4 ring-brand/5' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                            >
                               <div className="flex items-center gap-4">
                                  <div className={`p-4 rounded-2xl shrink-0 flex items-center justify-center ${formData.plan === plan.id ? 'bg-brand text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>
                                     {plan.icon}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex items-center justify-between">
                                        <h5 className="text-[14px] font-black uppercase tracking-tight text-slate-900">{plan.name}</h5>
                                        <span className="text-[16px] font-black text-brand tracking-tighter">{plan.price}</span>
                                     </div>
                                     <p className="text-[9px] font-bold text-brand/60 uppercase tracking-widest">Platform Core</p>
                                  </div>
                               </div>

                               <div className="space-y-3">
                                  <p className="text-[11px] font-bold text-slate-500 leading-snug uppercase tracking-tight">{plan.description}</p>
                                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                     {plan.features.map(f => (
                                       <div key={f} className="flex items-center gap-2">
                                          <Check size={10} className="text-emerald-500" strokeWidth={4} />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{f}</span>
                                       </div>
                                     ))}
                                  </div>
                               </div>

                               {formData.plan === plan.id && (
                                 <div className="absolute -top-2 -right-2 h-8 w-8 bg-brand text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <Check size={16} strokeWidth={4} />
                                 </div>
                               )}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div 
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10"
                    >
                       <div className="h-24 w-24 bg-brand/10 text-brand rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-brand/10">
                          <ShieldCheck size={48} />
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Hardened RBAC Access</h3>
                          <p className="text-xs font-black text-slate-400 max-w-sm mx-auto leading-relaxed uppercase tracking-widest">
                            By deploying this node, you agree to govern all operational workflows under strict Role-Based Access Control and ISO-compliant audit protocols.
                          </p>
                       </div>
                       <div className="flex flex-col gap-3 w-full max-w-xs">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <LockIcon size={16} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Audit Immutability</span>
                             </div>
                             <span className="text-[9px] font-black px-2 py-1 bg-emerald-500 text-white rounded uppercase ring-4 ring-emerald-50">Active</span>
                          </div>
                          <label className="flex items-start gap-3 text-left cursor-pointer group mt-4">
                             <div className={`mt-1 h-5 w-5 rounded-md border-2 shrink-0 transition-all ${formData.termsAccepted ? 'bg-brand border-brand' : 'bg-white border-slate-200'}`}>
                                {formData.termsAccepted && <Check size={14} className="text-white" strokeWidth={4} />}
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  checked={formData.termsAccepted}
                                  onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                                />
                             </div>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-tight pt-0.5">I verify that the above information is accurate and agree to the platform mission protocols.</span>
                          </label>
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div 
                      key="step-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10"
                    >
                       <div className="relative">
                          <div className="absolute inset-0 bg-brand blur-[60px] opacity-30 animate-pulse" />
                          <div className="h-36 w-36 bg-slate-900 text-brand rounded-[3.5rem] flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10">
                             <Zap size={70} />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">Manifest Readiness</h3>
                          <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto leading-relaxed uppercase tracking-tight">
                            Cluster configuration is verified. Initializing secure node for <span className="text-slate-900">{formData.name}</span> in the <span className="text-slate-900">{formData.region}</span> region.
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DNA TYPE</p>
                             <p className="text-[11px] font-black text-slate-900 uppercase">{formData.industry.replace('_', ' ')}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SERVICE LEVEL</p>
                             <p className="text-[11px] font-black text-slate-900 uppercase">{formData.plan}</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-auto pt-12 flex items-center justify-between">
                   <button 
                     disabled={currentStep === 0}
                     onClick={prev}
                     className="px-8 py-5 bg-slate-50 text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest disabled:opacity-0 transition-all flex items-center gap-2 hover:bg-slate-100"
                   >
                     <ChevronLeft size={16} /> Back
                   </button>
                   
                   <button 
                     disabled={currentStep === 3 && !formData.termsAccepted}
                     onClick={currentStep === STEPS.length - 1 ? handleComplete : next}
                     className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:grayscale"
                   >
                     {currentStep === STEPS.length - 1 ? 'Execute Provisioning' : 'Next Protocol'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </div>
       </main>

       <footer className="p-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] relative z-10 italic">
          Shipstack Engineering Systems • Secure Node Provisioning v4.5.2-LST
       </footer>
    </div>
  );
};


export default OnboardingFlow;
