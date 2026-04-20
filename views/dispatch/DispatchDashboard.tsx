
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility, User, Priority } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { 
  Truck, 
  AlertTriangle, 
  Inbox, 
  ChevronRight,
  Navigation,
  RefreshCw,
  Activity,
  Route as RouteIcon,
  Package,
  Clock,
  ArrowRight,
  Plus,
  Zap,
  CheckCircle2,
  Circle,
  Thermometer, 
  ShieldCheck, 
  ShoppingCart, 
  Activity as ActivityIcon, 
  BrainCircuit 
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../hooks/useTenant';
import { useAuthStore } from '../../store';

const StatCard = ({ title, value, icon: Icon, color, subValue, status, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.05 * index, duration: 0.5, type: "spring", stiffness: 100 }}
    whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)" }}
    className={`bg-charcoal rounded-2xl border-l-4 p-6 shadow-2xl transition-all group cursor-default ${
    status === 'success' ? 'border-l-emerald shadow-emerald/5' : 
    status === 'warning' ? 'border-l-amber shadow-amber/5' : 
    status === 'critical' ? 'border-l-red shadow-red/5' : 
    'border-l-brand shadow-brand/5'
  }`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 bg-navy text-white/80`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
      </div>
    </div>
    {subValue && (
      <div className="pt-4 border-t border-white/5 flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{subValue}</span>
      </div>
    )}
  </motion.div>
);

const SetupChecklist = ({ tenant, user, dns }: { tenant: any, user: any, dns: any[] }) => {
  const steps = [
    { id: 'role', label: 'Role Selection', completed: !!user?.role },
    { id: 'company', label: 'Company Profile', completed: !!tenant?.name },
    { id: 'industry', label: 'Industry Template', completed: !!tenant?.industry },
    { id: 'modules', label: 'Modules Configured', completed: (Array.isArray(tenant?.enabledModules) ? tenant.enabledModules.length : 0) > 0 },
    { id: 'logic', label: 'Business Rules', completed: !!tenant?.settings?.businessLogic },
    { id: 'shipment', label: 'First Shipment', completed: dns.length > 0 },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (progress === 100) return null;

  return (
    <div className="bg-brand text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Finish Your Setup</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Complete these steps to unlock full automation</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {steps.map(step => (
              <div key={step.id} className="flex items-center gap-2">
                {step.completed ? (
                  <CheckCircle2 size={14} className="text-emerald" />
                ) : (
                  <Circle size={14} className="text-white/20" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-wider ${step.completed ? 'text-white' : 'text-white/40'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-black tracking-tighter">{Math.round(progress)}%</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Complete</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative">
            <svg className="w-16 h-16 -rotate-90 absolute inset-0">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * progress) / 100}
                className="text-emerald transition-all duration-1000"
              />
            </svg>
            <Zap size={24} className="text-emerald" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DispatchDashboard: React.FC = () => {
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tenant, isModuleEnabled } = useTenant();

  useEffect(() => {
    if (tenant?.id) {
      loadData();
      const timer = setInterval(loadData, 10000);
      return () => clearInterval(timer);
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    const [dnsData, driversData] = await Promise.all([
      api.getDeliveryNotes(tenant.id),
      api.getDrivers(tenant.id)
    ]);
    setDns(dnsData);
    setDrivers(driversData);
    setLoading(false);
  };

  const handleAssign = async (dnId: string, driverId: string) => {
    setIsAssigning(dnId);
    try {
      await api.updateDeliveryNote(dnId, { driverId, status: DNStatus.READY_FOR_DISPATCH });
      await loadData();
    } catch (err) {
      console.error("Assignment failed", err);
    } finally {
      setIsAssigning(null);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red bg-red/10 border-red/20';
      case 'MEDIUM': return 'text-amber bg-amber/10 border-amber/20';
      default: return 'text-brand bg-brand/10 border-brand/20';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'HIGH': return 'Urgent';
      case 'MEDIUM': return 'High';
      default: return 'Normal';
    }
  };

  const pendingOrders = dns.filter(d => d.status === DNStatus.RECEIVED);

  return (
    <Layout title="Dispatcher Command Center" subtitle="Operational Control Hub">
      <div className="space-y-8">
        <SetupChecklist tenant={tenant} user={user} dns={dns} />

        {/* FEATURE 1: Auto-Dispatch Engine */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
          {(!tenant?.plan || tenant?.plan === 'STARTER' || tenant?.plan === 'GROWTH') && (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <div className="bg-white rounded-[2rem] p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="h-12 w-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand mx-auto mb-4">
                  <Zap size={24} />
                </div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Unlock Autonomous Dispatch</h4>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  Cortex AI predicts optimal routes with 94% accuracy. {tenant?.plan === 'STARTER' ? 'Upgrade to GROWTH to unlock AI routes, or SCALE for full autonomous dispatch.' : 'Your current plan includes AI suggestions. Upgrade to SCALE to enable the Autonomous Execution Engine.'}
                </p>
                <button 
                  onClick={() => navigate('/admin/subscription')}
                  className="w-full py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand-accent transition-all"
                >
                  View Scale Intelligence
                </button>
              </div>
            </div>
          )}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Zap size={160} className="text-brand" />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 relative z-10">
            {/* Confidence Gauge */}
            <div className="lg:w-1/3 flex flex-col items-center justify-center border-r border-white/10 pr-8">
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <circle 
                    cx="80" cy="80" r="70" fill="none" stroke="#0066FF" strokeWidth="12" 
                    strokeDasharray="439.8" strokeDashoffset={439.8 * (1 - 0.87)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-tighter">87%</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">AI Confidence</span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Optimization Optimal
                </p>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="lg:w-1/3 flex flex-col justify-center px-4">
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest mb-2">Auto-Dispatch Threshold</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                  Execute automatically when AI confidence exceeds this limit.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">70%</span>
                  <span className="text-xl font-black text-brand">85%</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">95%</span>
                </div>
                <input 
                  type="range" min="70" max="95" defaultValue="85"
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand"
                />
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Engine Status</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald">Autonomous</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Queue */}
            <div className="lg:w-1/3 flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Pending Auto-Dispatch</h3>
                <Badge variant="dispatched" className="bg-brand/20 text-brand border-none">3 In Queue</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'AD-102', confidence: 92, savings: '14m', status: 'AUTO' },
                  { id: 'AD-105', confidence: 89, savings: '22m', status: 'AUTO' },
                  { id: 'AD-109', confidence: 78, savings: '08m', status: 'REVIEW' },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black ${item.status === 'AUTO' ? 'bg-emerald/10 text-emerald' : 'bg-amber/10 text-amber'}`}>
                        {item.confidence}%
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight">Run {item.id}</p>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Est. Savings: {item.savings}</p>
                      </div>
                    </div>
                    <button className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      item.status === 'AUTO' ? 'bg-emerald text-white shadow-lg shadow-emerald/20' : 'bg-white/10 text-white/40 hover:bg-white/20'
                    }`}>
                      {item.status === 'AUTO' ? 'Auto-Execute' : 'Review Required'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Operational Overview</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Real-time logistics flow monitoring</p>
           </div>
           <button 
             onClick={() => navigate('/admin/dispatch')}
             className="btn-primary h-10 px-6"
           >
             <Plus size={16} /> New Run
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard index={0} title="Incoming Orders" value={dns.filter(d => d.status === DNStatus.RECEIVED).length} icon={Inbox} subValue="Awaiting Validation" />
          <StatCard index={1} title="Ready for Dispatch" value={dns.filter(d => d.status === DNStatus.READY_FOR_DISPATCH).length} icon={Zap} status="warning" subValue="Fulfilled & Packed" />
          <StatCard index={2} title="Active In-Transit" value={dns.filter(d => d.status === DNStatus.IN_TRANSIT).length} icon={Navigation} status="success" subValue="Live Tracking Active" />
          <StatCard index={3} title="Critical Exceptions" value={dns.filter(d => d.status === DNStatus.EXCEPTION).length} icon={AlertTriangle} status="critical" subValue="Immediate Action" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Order Assignment Panel */}
           <div className="lg:col-span-8 bg-charcoal rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5 bg-navy/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package size={14} className="text-brand" /> Pending Assignments
                </h3>
                <span className="text-[10px] font-black text-brand bg-brand/10 px-3 py-1 rounded-full">{pendingOrders.length} Orders</span>
              </div>
                 <div className="divide-y divide-white/5 overflow-y-auto max-h-[600px] no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {pendingOrders.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-20 text-center"
                      >
                          <div className="h-16 w-16 bg-navy rounded-2xl flex items-center justify-center text-white/10 mx-auto mb-4">
                             <CheckCircle2 size={32} />
                          </div>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">All orders assigned</p>
                      </motion.div>
                    ) : (
                      pendingOrders.map((dn, idx) => (
                         <motion.div 
                           key={dn.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 20 }}
                           transition={{ delay: idx * 0.05 }}
                           className="p-6 hover:bg-white/5 transition-all group"
                         >
                            <div className="flex items-center justify-between gap-4">
                               <div className="flex items-center gap-4 flex-1">
                                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-navy text-white/20`}>
                                     <Inbox size={24} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-[10px] font-black text-brand bg-brand/10 px-2 py-1 rounded">DN-{dn.externalId}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${getPriorityColor(dn.priority)}`}>
                                           {getPriorityLabel(dn.priority)}
                                        </span>
                                     </div>
                                     <p className="text-sm font-black text-white truncate leading-none mb-1">{dn.clientName}</p>
                                     <p className="text-[10px] text-white/40 truncate font-bold uppercase tracking-tight">{dn.address}</p>
                                  </div>
                               </div>
                               
                               <div className="flex items-center gap-3">
                                  <select 
                                    className="bg-navy border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 outline-none focus:border-brand transition-all"
                                    onChange={(e) => handleAssign(dn.id, e.target.value)}
                                    disabled={isAssigning === dn.id}
                                    defaultValue=""
                                  >
                                     <option value="" disabled>Select Driver</option>
                                     {drivers.filter(d => d.onDuty).map(driver => (
                                       <option key={driver.id} value={driver.id}>{driver.name}</option>
                                     ))}
                                  </select>
                                  <button 
                                    onClick={() => navigate(`/admin/trip/${dn.id}`)}
                                    className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center text-white/20 hover:text-brand hover:bg-brand/10 transition-all"
                                  >
                                     <ChevronRight size={18} />
                                   </button>
                               </div>
                            </div>
                         </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                 </div>
           </div>

           {/* Driver Availability Panel */}
           <div className="lg:col-span-4 space-y-6">
             {/* Vertical Intelligence Overlay */}
             {(tenant?.industry === 'FOOD' || tenant?.industry === 'MEDICAL' || tenant?.industry === 'PHARMA' || tenant?.industry === 'E-COMMERCE') && (
               <div className="bg-brand rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group mb-6">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     {tenant?.industry === 'FOOD' ? <Thermometer size={100} /> : 
                      tenant?.industry === 'E-COMMERCE' ? <ShoppingCart size={100} /> : 
                      <ShieldCheck size={100} />}
                  </div>
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{tenant?.industry} Intelligence</p>
                     <h3 className="text-lg font-black uppercase tracking-tight mb-4">Vertical Protocol</h3>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest p-2 bg-white/10 rounded-lg">
                           <span className="flex items-center gap-2"><ActivityIcon size={12} /> Sensors</span>
                           <span className="text-emerald font-mono">ON</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest p-2 bg-white/10 rounded-lg">
                           <span className="flex items-center gap-2"><BrainCircuit size={12} /> AI Integrity</span>
                           <span className="text-emerald font-mono">99.8%</span>
                        </div>
                     </div>
                  </div>
               </div>
             )}
              <div className="bg-charcoal rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                 <div className="p-6 border-b border-white/5 bg-navy/50">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      <Truck size={14} className="text-brand" /> Driver Fleet
                    </h3>
                 </div>
                 <div className="divide-y divide-white/5 overflow-y-auto max-h-[600px] no-scrollbar">
                    {drivers.map((driver, idx) => (
                      <motion.div 
                        key={driver.id} 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 flex items-center justify-between hover:bg-white/5 transition-all"
                      >
                         <div className="flex items-center gap-3">
                            <div className="relative">
                               <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center text-white/40 font-black text-xs">
                                  {driver.name.split(' ').map(n => n[0]).join('')}
                               </div>
                               <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-charcoal ${driver.onDuty ? 'bg-emerald' : 'bg-white/10'}`} />
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-1">{driver.name}</p>
                               <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{driver.company || 'Independent'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${driver.onDuty ? 'text-emerald bg-emerald/10' : 'text-white/20 bg-white/5'}`}>
                               {driver.onDuty ? 'Online' : 'Offline'}
                            </span>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              <div className="bg-navy rounded-2xl p-8 text-white shadow-2xl border border-white/5">
                 <h4 className="text-lg font-black uppercase tracking-tighter mb-6">Dispatcher Toolkit</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {isModuleEnabled('dispatch') && <ActionButton icon={RouteIcon} label="Optimize Routes" onClick={() => navigate('/admin/dispatch')} />}
                    {isModuleEnabled('fleet') && <ActionButton icon={Truck} label="Fleet Status" onClick={() => navigate('/admin/fleet')} />}
                    {isModuleEnabled('dispatch') && <ActionButton icon={Navigation} label="Live Map" onClick={() => navigate('/admin/tracking')} />}
                    {isModuleEnabled('dispatch') && <ActionButton icon={AlertTriangle} label="Resolve Alerts" onClick={() => navigate('/admin/exceptions')} />}
                 </div>
              </div>

              <div className="bg-charcoal rounded-2xl border border-white/5 p-8 shadow-2xl">
                 <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Recent Activity</h4>
                 <div className="space-y-6">
                    <ActivityItem 
                      index={0}
                      icon={CheckCircle2} 
                      color="text-emerald" 
                      title="Run Manifested" 
                      desc="TRP-9021 assigned to Driver John Doe" 
                      time="12 mins ago" 
                    />
                    <ActivityItem 
                      index={1}
                      icon={AlertTriangle} 
                      color="text-amber" 
                      title="Exception Raised" 
                      desc="DN-4421: Address not found in Syokimau" 
                      time="45 mins ago" 
                    />
                    <ActivityItem 
                      index={2}
                      icon={Truck} 
                      color="text-brand" 
                      title="Trip Started" 
                      desc="TRP-8812 is now in-transit" 
                      time="1 hour ago" 
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

const ActionButton = ({ icon: Icon, label, onClick }: any) => (
  <motion.button 
    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
  >
    <Icon size={24} className="text-brand group-hover:scale-110 transition-transform" />
    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</span>
  </motion.button>
);

const ActivityItem = ({ icon: Icon, color, title, desc, time, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 * index }}
    className="flex gap-4 group"
  >
    <div className={`h-8 w-8 rounded-lg bg-navy flex items-center justify-center ${color} shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={14} />
    </div>
    <div className="min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-[11px] font-black text-white uppercase tracking-tight">{title}</p>
        <span className="text-[8px] font-bold text-white/20 uppercase">{time}</span>
      </div>
      <p className="text-[10px] text-white/40 font-medium leading-tight truncate">{desc}</p>
    </div>
  </motion.div>
);

export default DispatchDashboard;
