import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Package, 
  ShoppingCart, 
  ShieldCheck, 
  CreditCard, 
  BarChart3, 
  Smartphone, 
  Building2, 
  Users, 
  Link,
  ChevronRight,
  ChevronLeft,
  Check,
  Building,
  Globe,
  Settings,
  Rocket
} from 'lucide-react';
import { useAuthStore, useTenantStore } from '../../store';
import { AVAILABLE_MODULES, INDUSTRY_TEMPLATES } from '../../constants';
import { ModuleId, IndustryType } from '../../types';
import { api } from '../../api';

const icons: Record<string, any> = {
  Truck, Package, ShoppingCart, ShieldCheck, CreditCard, BarChart3, Smartphone, Building2, Users, Link
};

const OnboardingView: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { currentTenant, setTenant } = useTenantStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState(currentTenant?.name || '');
  const [industry, setIndustry] = useState<IndustryType>(currentTenant?.industry || 'GENERAL');
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(currentTenant?.enabledModules || ['dispatch']);
  const [currency, setCurrency] = useState(currentTenant?.settings?.currency || 'KES');

  const handleIndustrySelect = (type: IndustryType) => {
    setIndustry(type);
    // Pre-select modules based on template
    const template = INDUSTRY_TEMPLATES[type];
    if (template) {
      setSelectedModules(template.modules);
    }
  };

  const toggleModule = (id: ModuleId) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updatedTenant = {
        ...currentTenant!,
        name: companyName,
        industry,
        enabledModules: selectedModules,
        settings: {
          ...currentTenant!.settings,
          currency,
          onboardingCompleted: true
        }
      };

      await api.updateTenant(currentTenant!.id, updatedTenant);
      setTenant(updatedTenant);
      
      if (user) {
        await api.updateUser(user.id, { isOnboarded: true });
        updateUser({ isOnboarded: true });
      }
      
      setIsSuccess(true);
      
      // Navigate to dashboard after a short delay to show success state
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    if (isSuccess) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
            <Rocket size={48} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Platform Ready</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Deploying your logistics infrastructure...</p>
          </div>
          <div className="max-w-xs mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
              className="h-full bg-emerald-500"
            />
          </div>
        </motion.div>
      );
    }

    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="mobile-h2">Welcome to Shipstack</h2>
              <p className="text-slate-500">Let's set up your logistics infrastructure in minutes.</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                    placeholder="e.g. Alpha Logistics Ltd"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Industry Sector</label>
                  {industry !== 'GENERAL' && (
                    <button 
                      onClick={handleComplete}
                      className="text-[10px] font-black text-brand uppercase tracking-widest hover:text-brand-accent transition-colors"
                    >
                      Skip to Dashboard
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['PHARMA', 'MEDICAL', 'FOOD', 'RETAIL', 'E-COMMERCE', 'MANUFACTURING', 'CONSTRUCTION', 'PROCESSING', 'GENERAL'] as IndustryType[]).map((ind) => (
                    <button
                      key={ind}
                      onClick={() => handleIndustrySelect(ind)}
                      className={`py-3 rounded-2xl text-[10px] font-bold transition-all border ${
                        industry === ind 
                          ? 'bg-brand text-white border-brand shadow-lg' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-accent'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {INDUSTRY_TEMPLATES[industry] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-brand/5 border border-brand/10 rounded-2xl"
                >
                  <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Recommended Template</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {INDUSTRY_TEMPLATES[industry].description}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="mobile-h2">Choose Your Modules</h2>
              <p className="text-slate-500">Select the features that match your operational workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {AVAILABLE_MODULES.map((module) => {
                const Icon = icons[module.icon];
                const isSelected = selectedModules.includes(module.id);
                return (
                  <button
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`p-6 rounded-[2rem] text-left transition-all border-2 relative group ${
                      isSelected 
                        ? 'bg-brand border-brand shadow-xl scale-[1.02]' 
                        : 'bg-white border-slate-100 hover:border-brand-accent/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-brand'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className={`font-bold mb-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {module.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                      {module.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-brand-teal rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="mobile-h2">Regional Settings</h2>
              <p className="text-slate-500">Configure localization for your operations.</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Operating Currency</label>
                <div className="grid grid-cols-3 gap-3">
                  {['KES', 'USD', 'UGX', 'TZS', 'RWF'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`py-4 rounded-2xl text-xs font-bold transition-all border ${
                        currency === curr 
                          ? 'bg-brand text-white border-brand shadow-lg' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-accent'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-brand-teal/5 border border-brand-teal/20 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-teal text-white rounded-xl flex items-center justify-center">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-teal">Ready for Launch</h4>
                    <p className="text-xs text-slate-500">Your custom stack is being prepared.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600">Selected Modules:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedModules.map(m => (
                      <span key={m} className="px-3 py-1 bg-white border border-brand-teal/20 rounded-full text-[10px] font-black uppercase tracking-wider text-brand-teal">
                        {m.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-black tracking-tighter text-xl uppercase">Shipstack</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 mr-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 3</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-500 ${
                  step === i ? 'w-12 bg-brand-accent shadow-sm shadow-brand-accent/40' : 
                  step > i ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'
                }`} 
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      {!isSuccess && (
        <footer className="p-8 border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1 || loading}
              className={`flex items-center gap-2 text-sm font-bold transition-all ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={step === 3 ? handleComplete : nextStep}
              disabled={loading || (step === 1 && !companyName)}
              className="touch-btn bg-brand text-white rounded-[2rem] min-w-[200px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all flex items-center gap-3 disabled:opacity-50 h-14 justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 3 ? 'Launch Platform' : 'Continue'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default OnboardingView;
