import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle2,
  Building,
  Globe,
  Settings,
  Rocket,
  Zap
} from 'lucide-react';
import { useAuthStore, useTenantStore } from '../../store';
import { AVAILABLE_MODULES, INDUSTRY_TEMPLATES } from '../../constants';
import { ModuleId, IndustryType, UserRole, DNStatus, Priority, LogisticsType } from '../../types';
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
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'ADMIN');
  const [companyName, setCompanyName] = useState(currentTenant?.name || '');
  const [industry, setIndustry] = useState<IndustryType>(currentTenant?.industry || 'GENERAL');
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(currentTenant?.enabledModules || ['dispatch']);
  const [currency, setCurrency] = useState(currentTenant?.settings?.currency || 'KES');

  // Business Logic State
  const [autoDispatch, setAutoDispatch] = useState(currentTenant?.settings?.businessLogic?.autoDispatch || false);
  const [podRequirements, setPodRequirements] = useState<('SIGNATURE' | 'PHOTO' | 'OTP')[]>(currentTenant?.settings?.businessLogic?.podRequirements || ['SIGNATURE']);
  const [lowStockThreshold, setLowStockThreshold] = useState(currentTenant?.settings?.businessLogic?.lowStockThreshold || 10);
  const [defaultTaxRate, setDefaultTaxRate] = useState(currentTenant?.settings?.businessLogic?.defaultTaxRate || 16);

  // First Shipment State
  const [firstShipment, setFirstShipment] = useState({
    clientName: '',
    address: '',
    items: [{ description: '', quantity: 1, weight: 0 }]
  });

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
          onboardingCompleted: true,
          businessLogic: {
            autoDispatch,
            podRequirements,
            lowStockThreshold,
            defaultTaxRate
          }
        }
      };

      await api.updateTenant(currentTenant!.id, updatedTenant);
      setTenant(updatedTenant);

      // Create first shipment if provided
      if (firstShipment.clientName && firstShipment.address) {
        await api.createDeliveryNote({
          externalId: `FIRST-${Date.now().toString().slice(-4)}`,
          clientName: firstShipment.clientName,
          address: firstShipment.address,
          status: DNStatus.RECEIVED,
          type: LogisticsType.OUTBOUND,
          items: firstShipment.items.map((item, idx) => ({
            id: `first-item-${idx}`,
            name: item.description || 'Sample Item',
            qty: item.quantity,
            unit: 'PCS'
          })),
          weightKg: firstShipment.items.reduce((acc, item) => acc + item.weight, 0),
          priority: 'MEDIUM' as Priority,
          createdAt: new Date().toISOString()
        }, currentTenant!.id);
      }
      
      if (user) {
        console.log('OnboardingView: Completing onboarding for user', user.id);
        const updatedUser = { ...user, role: selectedRole, isOnboarded: true };
        await api.updateUser(user.id, updatedUser);
        updateUser({ role: selectedRole, isOnboarded: true });
      }
      
      setIsSuccess(true);
      console.log('OnboardingView: Success state set, navigating in 2.5s');
      
      // Navigate to dashboard after a short delay to show success state
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        console.log('OnboardingView: Navigating to dashboard', { role: currentUser?.role, isOnboarded: currentUser?.isOnboarded });
        
        // Explicitly check role to ensure correct redirect
        if (currentUser?.role === 'DRIVER') {
          navigate('/driver', { replace: true });
        } else if (currentUser?.role === 'FACILITY') {
          navigate('/facility', { replace: true });
        } else if (currentUser?.role === 'CLIENT') {
          navigate('/client', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      }, 2500);
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
              <h2 className="mobile-h2">What best describes you?</h2>
              <p className="text-slate-500">We'll personalize your experience based on your role.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { id: 'CLIENT', label: 'Shipper', desc: 'I send goods & track deliveries', icon: Package },
                { id: 'ADMIN', label: 'Logistics Company', desc: 'I manage fleet & operations', icon: Truck },
                { id: 'DRIVER', label: 'Driver', desc: 'I deliver goods using the app', icon: Smartphone },
                { id: 'WAREHOUSE', label: 'Warehouse Manager', desc: 'I manage inventory & facilities', icon: Building2 },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id as UserRole)}
                  className={`p-6 rounded-[2rem] text-left transition-all border-2 relative group ${
                    selectedRole === role.id 
                      ? 'bg-brand border-brand shadow-xl' 
                      : 'bg-white border-slate-100 hover:border-brand-accent/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    selectedRole === role.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-brand'
                  }`}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <h3 className={`font-bold mb-1 ${selectedRole === role.id ? 'text-white' : 'text-slate-900'}`}>
                    {role.label}
                  </h3>
                  <p className={`text-[10px] font-bold uppercase tracking-tight ${selectedRole === role.id ? 'text-white/70' : 'text-slate-400'}`}>
                    {role.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-px w-12 bg-slate-200"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Or</span>
                <div className="h-px w-12 bg-slate-200"></div>
              </div>
              <button 
                onClick={() => {
                  setCompanyName(user?.company || 'My Logistics Co');
                  handleIndustrySelect('GENERAL');
                  handleComplete();
                }}
                className="flex items-center gap-2 px-8 py-4 bg-brand-teal/10 text-brand-teal rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-teal/20 transition-all border border-brand-teal/20"
              >
                <Zap size={16} />
                Quick Start with Defaults
              </button>
              <p className="text-[10px] text-slate-400 font-bold">Skip setup and explore the platform immediately.</p>
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
              <h2 className="mobile-h2">Company Profile</h2>
              <p className="text-slate-500">Tell us about your business.</p>
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
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                    placeholder="e.g. Alpha Logistics Ltd"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Industry Sector</label>
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

      case 3:
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

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="mobile-h2">Business Logic & Rules</h2>
              <p className="text-slate-500">Define how your operations should be automated and verified.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-tight">Auto-Dispatch</h4>
                    <p className="text-[10px] text-slate-500 font-bold">Automatically assign trips to available drivers.</p>
                  </div>
                  <button 
                    onClick={() => setAutoDispatch(!autoDispatch)}
                    className={`w-12 h-6 rounded-full transition-all relative ${autoDispatch ? 'bg-brand' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoDispatch ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proof of Delivery Requirements</label>
                  <div className="flex flex-wrap gap-2">
                    {(['SIGNATURE', 'PHOTO', 'OTP'] as const).map(req => (
                      <button
                        key={req}
                        onClick={() => setPodRequirements(prev => 
                          prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
                        )}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${
                          podRequirements.includes(req) 
                            ? 'bg-brand text-white border-brand' 
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                      >
                        {req}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Threshold</label>
                  <input 
                    type="number"
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-slate-400 font-bold">Alert when inventory drops below this level.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Tax Rate (%)</label>
                  <input 
                    type="number"
                    value={defaultTaxRate}
                    onChange={e => setDefaultTaxRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 5:
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

      case 6:
        if (selectedRole === 'DRIVER') {
          return (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center"
            >
              <div className="w-24 h-24 bg-brand/10 text-brand rounded-[2.5rem] flex items-center justify-center mx-auto">
                <Smartphone size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="mobile-h2">Driver Activation</h2>
                <p className="text-slate-500">You're almost ready to start delivering. Download the mobile app to begin receiving manifests.</p>
              </div>
              <div className="max-w-md mx-auto p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span className="text-xs font-bold text-slate-900">Account Verified</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">Pending Vehicle Assignment</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="mobile-h2">Your First Shipment</h2>
              <p className="text-slate-500">Let's book your first delivery to see the platform in action.</p>
            </div>

            <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Name</label>
                  <input 
                    type="text" 
                    value={firstShipment.clientName}
                    onChange={e => setFirstShipment({...firstShipment, clientName: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand"
                    placeholder="e.g. Nairobi Retail Hub"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Address</label>
                  <input 
                    type="text" 
                    value={firstShipment.address}
                    onChange={e => setFirstShipment({...firstShipment, address: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand"
                    placeholder="e.g. Mombasa Road, Gate 4"
                  />
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipment Content</label>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                      <input 
                        type="text" 
                        value={firstShipment.items[0].description}
                        onChange={e => {
                          const newItems = [...firstShipment.items];
                          newItems[0].description = e.target.value;
                          setFirstShipment({...firstShipment, items: newItems});
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-brand"
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" 
                        value={firstShipment.items[0].quantity}
                        onChange={e => {
                          const newItems = [...firstShipment.items];
                          newItems[0].quantity = parseInt(e.target.value);
                          setFirstShipment({...firstShipment, items: newItems});
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-brand"
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-lg">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Pro Tip</p>
                  <p className="text-[11px] text-orange-800 font-medium">You can skip this and create shipments later from the dashboard.</p>
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
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 6</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
              onClick={step === 6 ? handleComplete : nextStep}
              disabled={loading || (step === 2 && !companyName)}
              className="touch-btn bg-brand text-white rounded-[2rem] min-w-[200px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-accent transition-all flex items-center gap-3 disabled:opacity-50 h-14 justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 6 ? 'Launch Platform' : 'Continue'}
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
