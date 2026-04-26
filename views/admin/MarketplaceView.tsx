
import React, { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { 
  MARKETPLACE_MODULES, 
  getModulesForTier, 
  checkModuleDependencies, 
  checkModuleConflicts 
} from '../../constants/modules';
import { useModuleStore, useAppStore, useAuthStore, useAuditStore, useTenantStore } from '../../store';
import { 
  Search, 
  Grid, 
  Filter, 
  CheckCircle2, 
  Star, 
  ArrowRight,
  ExternalLink,
  Plus,
  Zap,
  ShieldCheck,
  Boxes,
  Info,
  ChevronRight,
  X,
  CreditCard,
  History as HistoryIcon,
  AlertCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';
import PermissionGate from '../../components/PermissionGate';
import { ModuleDefinition, ModuleCategory, ModuleTier } from '../../types';

const MarketplaceView: React.FC = () => {
  const { 
    installedModules, 
    installModule, 
    uninstallModule, 
    isModuleInstalled, 
    isModuleActive,
    pendingInstalls
  } = useModuleStore();
  const { currentTenant } = useTenantStore();
  const { addNotification } = useAppStore();
  const { logAction } = useAuditStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<ModuleTier | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'INSTALLED' | 'AVAILABLE'>('ALL');
  const [selectedSolution, setSelectedSolution] = useState<ModuleDefinition | null>(null);

  const filteredModules = useMemo(() => {
    return MARKETPLACE_MODULES.filter(mod => {
      const matchesSearch = mod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mod.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'ALL' || mod.category === selectedCategory;
      const matchesTier = selectedTier === 'ALL' || mod.tier === selectedTier;
      
      const isInstalled = isModuleInstalled(mod.id);
      const matchesStatus = selectedStatus === 'ALL' || 
                           (selectedStatus === 'INSTALLED' && isInstalled) ||
                           (selectedStatus === 'AVAILABLE' && !isInstalled);
                           
      return matchesSearch && matchesCategory && matchesTier && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedTier, selectedStatus, isModuleInstalled]);

  const handleInstall = async (mod: ModuleDefinition) => {
    try {
      await installModule(mod.id);
      addNotification({ 
        title: 'Installation Complete', 
        message: `${mod.name} has been successfully provisioned.`,
        type: 'success',
        category: 'MODULES'
      });
      setSelectedSolution(null);
    } catch (err: any) {
      addNotification({
        title: 'Installation Failed',
        message: err.message,
        type: 'error',
        category: 'MODULES'
      });
    }
  };

  const handleUninstall = async (mod: ModuleDefinition) => {
    if (confirm(`Are you sure you want to decommission ${mod.name}? All configuration will be lost.`)) {
      await uninstallModule(mod.id);
      addNotification({
        title: 'Module Decommissioned',
        message: `${mod.name} has been removed from your stack.`,
        type: 'warning',
        category: 'MODULES'
      });
      setSelectedSolution(null);
    }
  };

  return (
    <RoleGuard permissions={['marketplace:view']} showFullPageError>
      <Layout 
        title="Solution Marketplace" 
        subtitle="Growth engine for vertical intelligence & enterprise ops"
      >
        <div className="flex flex-col lg:flex-row gap-8 pb-24">
          {/* Left Sidebar Filters */}
          <aside className="lg:w-72 shrink-0 space-y-8">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Category</h4>
                  <div className="space-y-1">
                    {['ALL', 'industry_vertical', 'ai_feature', 'integration', 'addon', 'compliance'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedCategory === cat ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {cat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Pricing Tier</h4>
                  <div className="space-y-1">
                    {['ALL', 'free', 'starter', 'professional', 'enterprise'].map(tier => (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier as any)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedTier === tier ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">State</h4>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-brand"
                  >
                    <option value="ALL">All Modules</option>
                    <option value="INSTALLED">Installed</option>
                    <option value="AVAILABLE">Available</option>
                  </select>
               </div>

               <button 
                 onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedTier('ALL');
                    setSelectedStatus('ALL');
                 }}
                 className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red transition-all border border-transparent hover:border-red/10 rounded-xl"
               >
                 Reset Filters
               </button>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4 relative overflow-hidden group">
               <Zap size={100} className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700" />
               <h4 className="text-lg font-black uppercase tracking-tighter relative z-10">Scale for Growth</h4>
               <p className="text-[11px] font-medium text-white/60 leading-relaxed relative z-10">
                 Unlock advanced concurrency and high-frequency sync by moving to the Enterprise Tier.
               </p>
               <button className="w-full py-4 bg-brand-accent text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10 transform active:scale-95 transition-all">
                 Upgrade Plan
               </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 space-y-12">
            {/* Real-time Search */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="h-14 flex-1 bg-slate-50 rounded-2xl border border-transparent focus-within:border-brand/20 focus-within:bg-white transition-all flex items-center px-6 gap-4">
                  <Search size={20} className="text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by module name, tags, or publisher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm font-medium"
                  />
               </div>
               <div className="hidden md:flex flex-col items-end px-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Assets</span>
                  <span className="text-xl font-black text-slate-900 leading-none">{MARKETPLACE_MODULES.length}</span>
               </div>
            </div>

            {/* Featured Hero (Only on ALL/No Query) */}
            {selectedCategory === 'ALL' && !searchQuery && (
              <section className="relative rounded-[3.5rem] bg-indigo-600 p-12 overflow-hidden h-96 flex flex-col justify-end group shadow-2xl shadow-indigo-200">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-transparent z-10" />
                 <img 
                   src="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1200" 
                   className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s] opacity-40 mix-blend-overlay"
                   alt="Featured"
                   referrerPolicy="no-referrer"
                 />
                 <div className="relative z-20 space-y-4 max-w-lg">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-full w-fit">
                       <Star size={12} className="text-yellow-400 fill-yellow-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Featured Innovation</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-[0.9]">Cortex ML<br/>Dispatcher</h2>
                    <p className="text-sm font-medium text-white/70 leading-relaxed">
                      Transform your dispatch grid into a self-organizing autonomous ecosystem. ML-driven delay prediction and asset balancing.
                    </p>
                    <button 
                      onClick={() => setSelectedSolution(MARKETPLACE_MODULES.find(m => m.id === 'addon-cortex-ai') || null)}
                      className="px-10 py-4 bg-white text-indigo-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/btn"
                    >
                      Initialize Module <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </section>
            )}

            {/* Module Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {filteredModules.map(mod => (
                 <ModuleCard 
                   key={mod.id} 
                   module={mod} 
                   isInstalled={isModuleInstalled(mod.id)}
                   isPending={pendingInstalls.includes(mod.id)}
                   onClick={() => setSelectedSolution(mod)}
                 />
               ))}
               {filteredModules.length === 0 && (
                 <div className="col-span-full py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                       <Boxes size={40} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-2">No results for current filter</h4>
                    <p className="text-sm text-slate-500 font-medium max-w-xs">
                      Try expanding your search parameters or category selection to find more modules.
                    </p>
                 </div>
               )}
            </section>
          </main>
        </div>

        {/* Modal/Slide-over for Detail */}
        <AnimatePresence>
          {selectedSolution && (
            <ModuleDetailPanel 
              module={selectedSolution} 
              onClose={() => setSelectedSolution(null)}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
              isInstalled={isModuleInstalled(selectedSolution.id)}
              isPending={pendingInstalls.includes(selectedSolution.id)}
            />
          )}
        </AnimatePresence>
      </Layout>
    </RoleGuard>
  );
};

const ModuleCard = ({ module, isInstalled, isPending, onClick }: { 
  module: ModuleDefinition; 
  isInstalled: boolean;
  isPending: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      layoutId={`card-${module.id}`}
      onClick={onClick}
      className={`group bg-white rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col relative ${isInstalled ? 'border-brand/40' : 'border-slate-200'}`}
    >
      <div className="h-40 bg-slate-100 relative overflow-hidden">
         <img 
           src={module.screenshots?.[0] || `https://picsum.photos/seed/${module.id}/800/400`} 
           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
           alt={module.name}
           referrerPolicy="no-referrer"
         />
         <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur rounded-full flex items-center gap-1.5 shadow-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${module.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{module.category.replace('_', ' ')}</span>
         </div>
         {isInstalled && (
           <div className="absolute top-4 right-4 z-10 h-8 w-8 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-300">
              <CheckCircle2 size={16} />
           </div>
         )}
      </div>
      
      <div className="p-8 flex-1 flex flex-col">
         <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
               <Zap size={20} />
            </div>
            <div>
               <h4 className="text-[13px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{module.name}</h4>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">By {module.publisher.name}</p>
            </div>
         </div>
         
         <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2 mb-6">
            {module.description}
         </p>
         
         <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
            <div className="flex -space-x-2">
               {['#FF5733', '#33FF57', '#3357FF'].map((c, i) => (
                 <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/50?u=${module.id}${i}`} className="h-full w-full grayscale" />
                 </div>
               ))}
               <div className="h-5 w-5 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center">
                  <span className="text-[8px] font-black text-slate-400">{module.installCount || 0}+</span>
               </div>
            </div>
            
            <div className="text-right">
               <span className="text-[11px] font-black text-slate-900 uppercase">
                  {module.pricing.model === 'free' ? 'Free' : `$${module.pricing.amount}/mo`}
               </span>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

interface ModuleDetailProps {
  module: ModuleDefinition;
  onClose: () => void;
  onInstall: (m: ModuleDefinition) => Promise<void>;
  onUninstall: (m: ModuleDefinition) => Promise<void>;
  isInstalled: boolean;
  isPending: boolean;
}

const ModuleDetailPanel = ({ module, onClose, onInstall, onUninstall, isInstalled, isPending }: ModuleDetailProps) => {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        layoutId={`card-${module.id}`}
        className="w-full max-w-2xl bg-white h-full relative z-10 shadow-2xl flex flex-col"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 left-0 -translate-x-full h-12 w-12 bg-white text-slate-400 rounded-l-2xl flex items-center justify-center hover:text-slate-900 transition-all shadow-xl"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Hero Banner */}
          <div className="h-64 bg-slate-100 relative overflow-hidden">
             <img 
               src={module.screenshots?.[0] || `https://picsum.photos/seed/${module.id}/1200/600`} 
               className="w-full h-full object-cover opacity-90"
               alt={module.name}
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div className="px-10 pb-20 -mt-16 relative z-20 space-y-12">
             <header className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                   <div className="h-20 w-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                      {module.publisher.logo ? (
                        <img src={module.publisher.logo} className="h-full w-full object-cover" />
                      ) : (
                        <Boxes size={32} className="text-brand" />
                      )}
                   </div>
                   <div className="pt-2">
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2 leading-none">{module.name}</h2>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">v{module.version}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="flex text-yellow-500">
                                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= (module.rating || 0) ? 'currentColor' : 'none'} />)}
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{module.rating} ({module.installCount || 0})</span>
                          </div>
                       </div>
                   </div>
                </div>
             </header>

             <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                   "{module.description}"
                </p>
                <div className="flex flex-wrap gap-2">
                   {module.tags.map(tag => (
                     <span key={tag} className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-brand border border-brand/10">{tag}</span>
                   ))}
                </div>
             </section>

             <section className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tier Level</p>
                   <p className="text-sm font-black text-slate-900 uppercase">{module.tier}</p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-sm font-black text-emerald-500 uppercase">{module.status}</p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl col-span-2 lg:col-span-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pricing Model</p>
                   <p className="text-sm font-black text-slate-900 uppercase">{module.pricing.model.replace('_', ' ')}</p>
                </div>
             </section>

             <section className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-emerald-500" /> Core Capabilities
                </h4>
                <div className="grid grid-cols-1 gap-3">
                   {module.longDescription?.split('\n').filter(l => l).map((feat, i) => (
                     <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-brand/30 transition-all">
                        <span className="h-6 w-6 shrink-0 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-brand group-hover:text-white transition-all text-[10px] font-black">{i + 1}</span>
                        <p className="text-xs font-semibold text-slate-700 leading-snug">{feat}</p>
                     </div>
                   ))}
                   {!module.longDescription && (
                      [1,2,3].map(i => (
                        <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                           <ShieldCheck size={16} className="text-brand shrink-0" />
                           <p className="text-xs font-semibold text-slate-700">Production-grade {module.category.replace('_', ' ')} logic with localized Kenyan context.</p>
                        </div>
                      ))
                   )}
                </div>
             </section>

             <section className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Boxes size={14} className="text-amber-500" /> Technical Requirements
                </h4>
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y divide-slate-50 shadow-sm">
                   <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Zap size={16} className="text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Permissions Needed</span>
                      </div>
                      <div className="flex gap-2">
                         {module.permissionScope.requiredPermissions.map(p => (
                           <span key={p} className="text-[8px] font-black px-2 py-1 bg-amber-50 text-amber-600 rounded uppercase">{p}</span>
                         ))}
                      </div>
                   </div>
                   <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Boxes size={16} className="text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Dependencies</span>
                      </div>
                      <div className="flex gap-2 text-slate-400">
                         {module.dependencies.length > 0 ? module.dependencies.map(d => (
                           <span key={d.moduleId} className="text-[9px] font-bold uppercase">{d.moduleId} v{d.version}</span>
                         )) : <span className="text-[9px] font-bold uppercase">None</span>}
                      </div>
                   </div>
                   <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <ShieldAlert size={16} className="text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Conflicts</span>
                      </div>
                      <div className="text-slate-400">
                         {module.conflicts.length > 0 ? module.conflicts.map(c => (
                           <span key={c} className="text-[9px] font-bold uppercase text-red-400">{c}</span>
                         )) : <span className="text-[9px] font-bold uppercase">Clean Stack</span>}
                      </div>
                   </div>
                </div>
             </section>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-10 bg-white border-t border-slate-100 flex items-center justify-between shadow-2xl relative z-30">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Standard Price</span>
              <span className="text-2xl font-black text-slate-900 leading-none">
                 {module.pricing.model === 'free' ? 'Free Access' : `$${module.pricing.amount}/mo`}
              </span>
           </div>
           <div className="flex items-center gap-4">
              {isInstalled ? (
                <button 
                  onClick={() => onUninstall(module)}
                  className="px-10 py-5 bg-red/10 text-red rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red hover:text-white transition-all flex items-center gap-2"
                >
                  Uninstall Module
                </button>
              ) : (
                <PermissionGate permission="marketplace:install">
                  <button 
                    disabled={isPending}
                    onClick={() => onInstall(module)}
                    className="px-12 py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-brand/30 active:scale-95 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                    {isPending ? 'Provisioning...' : 'Activate Module'}
                  </button>
                </PermissionGate>
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MarketplaceView;
