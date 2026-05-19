
import React, { useState, useEffect } from 'react';
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
  Check,
  Package,
  Truck,
  DollarSign,
  Layers,
  Settings,
  Bell,
  HardDrive,
  Cpu,
  Monitor,
  Database,
  Cloud,
  Network
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore, useAuthStore, useAuditStore, useAppStore } from '../../store';
import { INDUSTRY_MODULE_MAPPING, MODULE_DETAILS } from '../../constants';
import { api } from '../../api';
import * as Icons from 'lucide-react';

const STEPS = [
  { id: 'organization', title: 'Your Company', icon: <Building2 className="text-brand" /> },
  { id: 'industry', title: 'Your Industry', icon: <Boxes className="text-brand" /> },
  { id: 'modules', title: 'Modules', icon: <Layers className="text-brand" /> },
  { id: 'pricing', title: 'Pricing', icon: <BarChart3 className="text-brand" /> },
  { id: 'deployment', title: 'Finish Setup', icon: <Zap className="text-brand" /> }
];

const INDUSTRIES = [
  { 
    id: 'HEALTHCARE', 
    name: 'Healthcare & Pharma', 
    image: 'https://images.unsplash.com/photo-1538108197017-c1b4467a933a?auto=format&fit=crop&q=80&w=800',
    description: 'Cold chain, medical logistics, and bio-security protocols.',
    icon: <Activity className="text-blue-500" /> 
  },
  { 
    id: 'AGRICULTURE', 
    name: 'Agri-Logistics', 
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800',
    description: 'Farm-to-fork tracking, bulk transport, and market metrics.',
    icon: <Sprout className="text-emerald-500" /> 
  },
  { 
    id: 'RETAIL', 
    name: 'Retail Distribution', 
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800',
    description: 'B2B fulfillment, inventory rebalancing, and restocking.',
    icon: <ShoppingBag className="text-amber-500" /> 
  },
  { 
    id: 'E-COMMERCE', 
    name: 'E-Commerce Hero', 
    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=800',
    description: 'Last-mile optimization, peak scaling, and home delivery.',
    icon: <ShoppingCart className="text-brand" /> 
  },
  {
    id: 'GENERAL',
    name: 'General Logistics',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800',
    description: 'Standard transport, warehousing, and asset management.',
    icon: <Truck className="text-slate-500" />
  }
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
  const navigate = useNavigate();
  const { isOnline, addNotification } = useAppStore();
  const { user, updateUser } = useAuthStore(state => ({
    user: state.user,
    updateUser: state.updateUser
  }));
  const setTenant = useTenantStore(state => state.setTenant);
  const logAction = useAuditStore(state => state.logAction);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.company || '',
    industry: 'GENERAL',
    plan: 'GROWTH',
    region: 'East Africa',
    size: '11-50',
    adminEmail: user?.email || '',
    termsAccepted: false,
    enabledModules: [] as string[]
  });

  useEffect(() => {
    if (user?.company) {
      setFormData(prev => ({ ...prev, name: user.company }));
    }
  }, [user]);

  // Auto-select modules when industry changes
  useEffect(() => {
    const recommended = INDUSTRY_MODULE_MAPPING[formData.industry as any] || INDUSTRY_MODULE_MAPPING.GENERAL;
    setFormData(prev => ({ ...prev, enabledModules: recommended }));
  }, [formData.industry]);

  const handleComplete = async () => {
    if (!user) return;
    try {
      await api.completeOnboarding(user.id, {
        industry: formData.industry as any,
        modules: formData.enabledModules as any,
        companyName: formData.name
      });

      // Finalize tenant setup (state-side)
      const newTenant = {
        id: user.tenantId || `tenant-${Date.now()}`,
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/ /g, '-'),
        industry: formData.industry as any,
        plan: formData.plan as any,
        status: 'ACTIVE' as any,
        enabledModules: formData.enabledModules,
        settings: {
          primaryColor: '#0F2A44',
          currency: 'KES',
          timezone: 'Africa/Nairobi',
          onboardingCompleted: true
        },
        createdAt: new Date().toISOString()
      };

      setTenant(newTenant as any);
      updateUser({ 
        isOnboarded: true, 
        enabledModules: formData.enabledModules as any,
        company: formData.name
      });
      addNotification("Operational Cluster Initialized.", "success");
      navigate('/admin');
    } catch (err: any) {
      addNotification(err.message || "Failed to initialize cluster.", "error");
    }
  };

  const next = () => {
    if (currentStep === 0 && !formData.name) return;
    setCurrentStep(s => s + 1);
  };
  const prev = () => setCurrentStep(s => s - 1);

  const toggleModule = (modId: string) => {
    setFormData(prev => ({
      ...prev,
      enabledModules: prev.enabledModules.includes(modId) 
        ? prev.enabledModules.filter(m => m !== modId)
        : [...prev.enabledModules, modId]
    }));
  };

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
                          <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Choose your business sector. We will tailor the modules and workflows to match your operational requirements.</p>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto max-h-[450px] pr-2 pb-4 no-scrollbar">
                          {INDUSTRIES.map(ind => (
                            <button
                              key={ind.id}
                              onClick={() => setFormData({...formData, industry: ind.id})}
                              className={`group relative h-48 rounded-[2.5rem] overflow-hidden border-4 transition-all ${formData.industry === ind.id ? 'border-brand shadow-2xl scale-[1.02]' : 'border-white hover:border-slate-200'}`}
                            >
                               <img src={ind.image} alt={ind.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                               <div className="absolute bottom-6 left-6 right-6 text-left">
                                  <div className="flex items-center gap-3 mb-2">
                                     <div className="h-8 w-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                                        {ind.icon}
                                     </div>
                                     <h5 className="text-[14px] font-black uppercase tracking-tighter text-white">{ind.name}</h5>
                                  </div>
                                  <p className="text-[10px] font-bold text-white/60 leading-tight uppercase tracking-wider line-clamp-2">{ind.description}</p>
                               </div>
                               {formData.industry === ind.id && (
                                 <div className="absolute top-6 right-6 h-10 w-10 bg-brand text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/20 backdrop-blur-sm">
                                    <Check size={20} strokeWidth={4} />
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
                       <div className="space-y-4">
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Core Infrastructure</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <button
                               onClick={() => toggleModule('fleet')}
                               className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${formData.enabledModules.includes('fleet') ? 'bg-brand/5 border-brand shadow-md' : 'bg-white border-slate-50'}`}
                             >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${formData.enabledModules.includes('fleet') ? 'bg-brand text-white' : 'bg-slate-50 text-slate-400'}`}>
                                   <Truck size={22} />
                                </div>
                                <div>
                                   <h5 className="text-[12px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">Managed Fleet</h5>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Own/manage vehicles</p>
                                </div>
                                <div className={`ml-auto h-6 w-6 rounded-lg border-2 flex items-center justify-center ${formData.enabledModules.includes('fleet') ? 'bg-brand border-brand text-white' : 'border-slate-100'}`}>
                                   {formData.enabledModules.includes('fleet') && <Check size={14} strokeWidth={4} />}
                                </div>
                             </button>
                             <button
                               onClick={() => toggleModule('crm')}
                               className={`p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${formData.enabledModules.includes('crm') ? 'bg-brand/5 border-brand shadow-md' : 'bg-white border-slate-50'}`}
                             >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${formData.enabledModules.includes('crm') ? 'bg-brand text-white' : 'bg-slate-50 text-slate-400'}`}>
                                   <Users size={22} />
                                </div>
                                <div>
                                   <h5 className="text-[12px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">Relationships</h5>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer CRM</p>
                                </div>
                                <div className={`ml-auto h-6 w-6 rounded-lg border-2 flex items-center justify-center ${formData.enabledModules.includes('crm') ? 'bg-brand border-brand text-white' : 'border-slate-100'}`}>
                                   {formData.enabledModules.includes('crm') && <Check size={14} strokeWidth={4} />}
                                </div>
                             </button>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Additional Vertical Modules</h4>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Expand capabilities with specialized {formData.industry.toLowerCase()} tools.</p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[300px] pr-2 pb-4 no-scrollbar">
                          {(() => {
                            const recommended = INDUSTRY_MODULE_MAPPING[formData.industry as any] || INDUSTRY_MODULE_MAPPING.GENERAL;
                            return Object.keys(MODULE_DETAILS)
                              .filter(id => recommended.includes(id as any) && !id.startsWith('core-') && id !== 'fleet' && id !== 'crm')
                              .map(modId => {
                                const mod = MODULE_DETAILS[modId as any];
                                if (!mod) return null;
                                const isSelected = formData.enabledModules.includes(modId);
                                const IconComp = (Icons as any)[mod.icon] || Layers;
                                
                                return (
                                  <button
                                    key={modId}
                                    onClick={() => toggleModule(modId)}
                                    className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center gap-4 ${isSelected ? 'bg-brand/5 border-brand shadow-md' : 'bg-white border-slate-50 hover:border-slate-100'}`}
                                  >
                                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400'}`}>
                                        <IconComp size={22} />
                                     </div>
                                     <div className="min-w-0">
                                        <h5 className="text-[12px] font-black uppercase tracking-tight text-slate-900 mb-0.5">{mod.name}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase tracking-wider line-clamp-1">{mod.description}</p>
                                     </div>
                                     <div className={`ml-auto h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand border-brand text-white' : 'border-slate-100'}`}>
                                        {isSelected && <Check size={14} strokeWidth={4} />}
                                     </div>
                                  </button>
                                );
                              });
                          })()}
                       </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div 
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1 space-y-8"
                    >
                       <div className="space-y-2">
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Select Service Level</h4>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Choose the throughput and processing power required for your fleet.</p>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto max-h-[450px] no-scrollbar pb-4 pr-1">
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
                                  <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3">
                                     {plan.features.map(f => (
                                       <div key={f} className="flex items-center gap-2">
                                          <Check size={10} className="text-emerald-500" strokeWidth={4} />
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{f}</span>
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
                       <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DNA TYPE</p>
                             <p className="text-[11px] font-black text-slate-900 uppercase truncate">{formData.industry.replace('_', ' ')}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MODULES</p>
                             <p className="text-[11px] font-black text-slate-900 uppercase truncate">{formData.enabledModules.length} Active</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SERVICE LEVEL</p>
                             <p className="text-[11px] font-black text-slate-900 uppercase truncate">{formData.plan}</p>
                          </div>
                       </div>

                       <div className="flex flex-col gap-4 w-full max-w-sm">
                          <label className="flex items-start gap-3 text-left cursor-pointer group">
                              <div className={`mt-1 h-6 w-6 rounded-lg border-2 shrink-0 transition-all ${formData.termsAccepted ? 'bg-brand border-brand shadow-lg shadow-brand/20' : 'bg-white border-slate-200'}`}>
                                 {formData.termsAccepted && <Check size={16} className="text-white" strokeWidth={4} />}
                                 <input 
                                   type="checkbox" 
                                   className="hidden"
                                   checked={formData.termsAccepted}
                                   onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                                 />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-tight pt-1">I verify that the above information is accurate and agree to the platform mission protocols and enterprise service agreement.</span>
                          </label>
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
                     disabled={currentStep === 4 && !formData.termsAccepted}
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
