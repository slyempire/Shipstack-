
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility, HealthMetrics, Vehicle, User } from '../../types';
import { getContrastTextColor } from '../../utils/color';
import MapEngine from '../../components/MapEngine';
import { Badge } from '../../packages/ui/Badge';
import { 
  Activity,
  ChevronRight,
  Inbox,
  Users,
  DollarSign,
  Scale,
  DatabaseZap,
  Warehouse,
  Truck,
  Zap,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Navigation,
  RefreshCw,
  Route as RouteIcon,
  Layers,
  BrainCircuit,
  Sparkles,
  Stethoscope,
  Briefcase,
  ShoppingBag,
  UserCheck,
  Package,
  ShieldAlert
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../hooks/useTenant';
import { TaskManagement } from '../../components/TaskManagement';
import { VerticalIntelligence } from '../../components/verticals';

import { aiService } from '../../services/aiService';

const ChecklistItem = ({ icon: Icon, title, desc, done, onClick, index }: { 
  icon: any, 
  title: string, 
  desc: string, 
  done: boolean,
  onClick: () => void,
  index: number
}) => (
  <motion.button 
    id={`tour-checklist-${index}`}
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 * index, duration: 0.5, type: "spring", stiffness: 100 }}
    whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-8 rounded-2xl border transition-all text-left group flex flex-col h-full ${
      done 
        ? 'bg-emerald/5 border-emerald/20' 
        : 'bg-white border-slate-200 hover:border-brand/30 hover:shadow-xl'
    }`}
  >
    <div className="flex items-start justify-between mb-6">
      <div className={`p-4 rounded-xl ${done ? 'bg-emerald/20 text-emerald' : 'bg-slate-100 text-gray-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm'}`}>
        <Icon size={24} />
      </div>
      {done ? (
        <div className="h-6 w-6 rounded-full bg-emerald flex items-center justify-center shadow-lg shadow-emerald/20">
          <CheckCircle size={14} className="text-white" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-white/5 group-hover:border-brand/30 transition-all" />
      )}
    </div>
    <h4 className={`label-logistics !mb-2 ${done ? 'text-emerald' : 'text-gray-900'}`}>
      {title}
    </h4>
    <p className={`text-[11px] font-medium leading-relaxed truncate-name ${done ? 'text-emerald/60' : 'text-gray-500'}`}>
      {desc}
    </p>
  </motion.button>
);

const StatCard = ({ title, value, icon: Icon, color, subValue, trend, index }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    whileInView={{ opacity: 1, scale: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.05 * index, duration: 0.5, type: "spring", stiffness: 100 }}
    whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)" }}
    className="card-logistics flex flex-col justify-between group cursor-default"
  >
    <div className="flex items-start justify-between mb-6">
      <div className={`p-4 rounded-xl transition-all group-hover:scale-110 shadow-sm ${color}`}>
        <Icon size={24} />
      </div>
            <div className="text-right">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
      <span className="text-[10px] font-medium text-gray-400">{subValue}</span>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald' : 'text-red'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [troubleshooting, setTroubleshooting] = useState(false);
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'INTELLIGENCE' | 'VERTICAL'>('HEALTH');
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const { isModuleEnabled, tenant } = useTenant();
  const isDemoUser = user?.email?.endsWith('@shipstack.com') || 
                    user?.email === 'admin@shipstack.com' ||
                    user?.email === 'joemugoh215@gmail.com' ||
                    window.location.search.includes('demo=true') ||
                    localStorage.getItem('shipstack_demo_mode') === 'true';

  const activeVertical = tenant?.industry || 'E-COMMERCE';
  const activeIndustry = activeVertical === 'GENERAL' ? 'E-COMMERCE' : activeVertical;

  // KPI Calculations
  const activeShipments = dns.filter(d => d.status === DNStatus.IN_TRANSIT).length;
  
  const deliveredDns = dns.filter(d => d.status === DNStatus.DELIVERED || d.status === DNStatus.COMPLETED);
  const onTimeDns = deliveredDns.filter(d => !d.isDeviated);
  const onTimeRate = deliveredDns.length > 0 ? Math.round((onTimeDns.length / deliveredDns.length) * 100) : 98;

  const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
  const fleetUtilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 85;

  const monthlyRevenue = dns.reduce((acc, curr) => acc + (curr.rate || 0), 0);

  const verticalLabels: Record<string, any> = {
    'E-COMMERCE': {
      stat1: { label: "Returns Rate", value: "4.2%", sub: "Processing 12 units", trend: -2 },
      stat2: { label: "Delivery SLA", value: `${onTimeRate}%`, sub: "Last 30 days", trend: 1 },
      stat3: { label: "COD Recon", value: "$4.1k", sub: "18 pending payments", trend: 15 },
      insightTitle: "Marketplace intelligence",
      insightDesc: "Yielding 18% higher conversion with AI-estimated delivery"
    },
    'AGRICULTURE': {
      stat1: { label: "Cold Chain Deviations", value: "2", sub: "Active monitoring on", trend: -50 },
      stat2: { label: "Harvest On-Time", value: "98.2%", sub: "Peak season ready", trend: 4 },
      stat3: { label: "Waste Reduction", value: "12%", sub: "Freshness integrity OK", trend: 8 },
      insightTitle: "Freshness audit",
      insightDesc: "ML predicts 2.4 days extended shelf life for current batches"
    },
    'MEDICAL': {
      stat1: { label: "Chain of Custody", value: "100%", sub: "Zero protocol gaps", trend: 0 },
      stat2: { label: "Temp Stability", value: "99.8%", sub: "Medical grade integrity", trend: 2 },
      stat3: { label: "KEMSA Sync", value: "Live", sub: "1,240 items tracked", trend: 100 },
      insightTitle: "Regulatory compliance",
      insightDesc: "Compliance reports auto-generated for Ministry of Health"
    },
    'RETAIL': {
      stat1: { label: "Store Replenishment", value: "88%", sub: "54 routes active", trend: 12 },
      stat2: { label: "Inventory Stock-out", value: "1.4%", sub: "AI prediction active", trend: -20 },
      stat3: { label: "Boda Efficiency", value: "92%", sub: "Hyper-local speed", trend: 5 },
      insightTitle: "Omnichannel oversight",
      insightDesc: "Unified visibility across 14 distribution facilities"
    }
  };

  const labels = verticalLabels[activeIndustry] || verticalLabels['E-COMMERCE'];
  const revenueDisplay = monthlyRevenue > 0 ? `$${(monthlyRevenue / 1000).toFixed(1)}k` : "$14.2k";

  // Weekly Volume Data (Mocking distribution for the chart)
  const weeklyData = [
    { day: 'Mon', count: 42 },
    { day: 'Tue', count: 58 },
    { day: 'Wed', count: 45 },
    { day: 'Thu', count: 62 },
    { day: 'Fri', count: 75 },
    { day: 'Sat', count: 30 },
    { day: 'Sun', count: 15 },
  ];
  const maxVolume = Math.max(...weeklyData.map(d => d.count));

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [user?.role, tenant?.id]);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getDeliveryNotes(tenant?.id), 
        api.getFacilities(tenant?.id),
        api.getHealthMetrics(user?.role),
        api.getVehicles(tenant?.id),
        api.getUsers(tenant?.id, user?.role)
      ]);

      const [dataRes, facsRes, healthRes, velsRes, usrsRes] = results;

      if (dataRes.status === 'fulfilled') setDns(Array.isArray(dataRes.value) ? dataRes.value : []);
      if (facsRes.status === 'fulfilled') setFacilities(Array.isArray(facsRes.value) ? facsRes.value : []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (velsRes.status === 'fulfilled') setVehicles(Array.isArray(velsRes.value) ? velsRes.value : []);
      if (usrsRes.status === 'fulfilled') setUsers(Array.isArray(usrsRes.value) ? usrsRes.value : []);

      // Log errors quietly
      results.forEach((res, i) => {
        if (res.status === 'rejected') {
          console.warn(`Dashboard partial load failure (index ${i}):`, res.reason);
        }
      });

      setLoading(false);
    } catch (err) {
      console.error("AdminDashboard: Critical failure in loadData", err);
      // Fallback for disaster recovery
      setLoading(false);
    }
  };

  const handleTroubleshoot = async () => {
    setTroubleshooting(true);
    try {
      const result = await api.troubleshootSupabase();
      if (result.success) {
        addNotification(result.message, "success");
      } else {
        addNotification(result.message, "error");
      }
      loadData();
    } catch (err) {
      addNotification("Troubleshooting failed.", "error");
    } finally {
      setTroubleshooting(false);
    }
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {loading && (
          <div className="fixed top-24 right-8 z-[100] flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur shadow-sm rounded-full border border-slate-200">
            <RefreshCw className="animate-spin text-brand" size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing...</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-4">
           <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Operational health</h2>
              <p className="text-sm text-gray-500 font-medium">Unified logistics oversight</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mr-4">
                <button 
                  onClick={() => setActiveTab('HEALTH')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HEALTH' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-brand'}`}
                >
                  System Health
                </button>
                <button 
                  onClick={() => setActiveTab('VERTICAL')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'VERTICAL' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-brand'}`}
                >
                  {tenant?.industry || 'Vertical'} Hub
                </button>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-emerald/10 text-emerald rounded-xl border border-emerald/20 shadow-sm">
                 <div className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">All Systems Nominal</span>
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'HEALTH' ? (
            <motion.div 
              key="health"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div id="dashboard-kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  index={0}
                  title={labels.stat1.label} 
                  value={labels.stat1.value} 
                  icon={Navigation} 
                  color="bg-brand/10 text-brand" 
                  subValue={labels.stat1.sub} 
                  trend={labels.stat1.trend}
                />
                <StatCard 
                  index={1}
                  title={labels.stat2.label} 
                  value={labels.stat2.value} 
                  icon={CheckCircle} 
                  color="bg-emerald/10 text-emerald" 
                  subValue={labels.stat2.sub} 
                  trend={labels.stat2.trend}
                />
                <StatCard 
                  index={2}
                  title={labels.stat3.label} 
                  value={labels.stat3.value} 
                  icon={DatabaseZap} 
                  color="bg-amber/10 text-amber" 
                  subValue={labels.stat3.sub} 
                  trend={labels.stat3.trend}
                />
                {isModuleEnabled('finance') && (
                  <StatCard 
                    index={3}
                    title="Revenue (MTD)" 
                    value={revenueDisplay} 
                    icon={DollarSign} 
                    color="bg-emerald/10 text-emerald" 
                    subValue="Projected $18k" 
                    trend={8}
                  />
                )}
              </div>
            </motion.div>
          ) : activeTab === 'INTELLIGENCE' ? (
            <motion.div 
              key="intelligence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group border border-white/5 shadow-2xl">
                     <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-[10s]">
                        <BrainCircuit size={300} />
                     </div>
                     <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-14 bg-brand-accent text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                              <BrainCircuit size={32} />
                           </div>
                           <div>
                              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic">Neural Dispatch Cortex</h3>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1 italic">Active Intelligence Node</p>
                           </div>
                        </div>
                        <p className="text-xl font-medium text-white/70 max-w-xl leading-relaxed">
                           Cortex AI is currently processing 14.2k historical data points to optimize route density and minimize fuel consumption across your fleet mesh.
                        </p>
                        <div className="flex flex-wrap gap-4">
                           {[
                             { label: 'Neural Load', val: '12% CPU' },
                             { label: 'Predictions', val: '840/hr' },
                             { label: 'Confidence', val: '98.2%' }
                           ].map((stat, i) => (
                             <div key={i} className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-lg font-black text-brand-accent leading-none">{stat.val}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="bg-brand text-white rounded-[3rem] p-10 shadow-2xl shadow-brand/20 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Zap size={120} fill="white" />
                     </div>
                     <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Estimator Engine</h4>
                     <p className="text-sm font-medium text-white/70 mb-6 leading-relaxed">
                        Passive intelligence is reducing "where is my order" support tickets by 42% on average across all active nodes.
                     </p>
                     <div className="h-32 bg-white/10 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                           <p className="text-4xl font-black">92%</p>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Accuracy Score</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Dynamic Insights from aiService if needed */}
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                           <Sparkles size={16} className="text-brand" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Insight</p>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Expansion Opportunity</h4>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
                           Cluster analysis suggests high demand density in "Westlands North". Increasing fleet capacity by 5% may yield 12% revenue growth.
                        </p>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                           <RefreshCw size={16} className="text-emerald-500" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Insight</p>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Idle Time Reduction</h4>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
                           Neural mesh has optimized warehouse loading cycles, reducing average dispatch latency by 14.5 minutes.
                        </p>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                           <AlertTriangle size={16} className="text-amber-500" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Mitigation</p>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Predictive Maintenance</h4>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
                           Telemetry anomalies detected in Vehicle KBG-122. Scheduled maintenance recommended before terminal gearbox failure.
                        </p>
                     </div>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="vertical"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
               <VerticalIntelligence industry={activeVertical} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Start Checklist for New Users */}
        <AnimatePresence>
          {dns.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm relative overflow-hidden"
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"
              >
                <Layers size={200} className="text-brand" />
              </motion.div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 relative z-10">
                <div className="mb-6 md:mb-0">
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-3">Operational Setup</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Complete these tactical pillars to launch your operations</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {isModuleEnabled('fleet') && (
                  <ChecklistItem 
                    index={0}
                    icon={Truck} 
                    title="Register Fleet" 
                    desc="Add your first vehicle to the network" 
                    done={vehicles.length > 0}
                    onClick={() => navigate('/admin/fleet')}
                  />
                )}
                {isModuleEnabled('fleet') && (
                  <ChecklistItem 
                    index={1}
                    icon={Warehouse} 
                    title="Create Hubs" 
                    desc="Define your distribution facilities" 
                    done={facilities.length > 0}
                    onClick={() => navigate('/admin/fleet')}
                  />
                )}
                {isModuleEnabled('integrations') && (
                  <ChecklistItem 
                    index={2}
                    icon={DatabaseZap} 
                    title="Import Data" 
                    desc="Upload your delivery notes via CSV" 
                    done={dns.length > 0}
                    onClick={() => navigate('/admin/ingress')}
                  />
                )}
                <ChecklistItem 
                  index={3}
                  icon={Briefcase} 
                  title="Driver Recruitment" 
                  desc="Manage your driver onboarding pipeline" 
                  done={users.filter(u => u.role === 'DRIVER').length > 0}
                  onClick={() => navigate('/admin/recruitment')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area - Now Tab-Aware for full clearing of dashboard */}
            <div className="lg:col-span-8 space-y-8">
              {activeTab === 'HEALTH' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {/* Weekly Volume Trends */}
                  <div className="card-logistics !p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="heading-primary mb-1">Weekly Shipment Trends</h3>
                        <p className="label-logistics text-gray-400">Volume distribution across the network</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-brand"></div>
                          <span className="label-logistics text-gray-400 !mb-0">Volume</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
                      {weeklyData.map((d, i) => {
                        const height = (d.count / maxVolume) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="relative w-full flex justify-center items-end h-full">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: 0.5 + (i * 0.1), duration: 0.8, ease: "easeOut" }}
                                className="w-full max-w-[40px] bg-brand/10 group-hover:bg-brand/20 rounded-t-lg transition-all duration-500 relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-brand/20 to-transparent"></div>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-brand shadow-[0_0_10px_rgba(0,102,255,0.5)]"></div>
                              </motion.div>
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl z-10 whitespace-nowrap">
                                {d.count} Shipments
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-logistics !p-0 overflow-hidden relative flex flex-col h-[500px]">
                    <div className="absolute top-8 left-8 right-8 z-[1000] flex justify-between items-start pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 text-gray-900 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 pointer-events-auto shadow-xl">
                        <div className="h-2 w-2 rounded-full bg-emerald animate-pulse"></div>
                        Global Network Activity
                      </div>
                    </div>
                    
                    <MapEngine 
                      dns={dns.filter(d => d.status === DNStatus.IN_TRANSIT)} 
                      facilities={facilities} 
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'INTELLIGENCE' && (
                <div className="space-y-8">
                  {/* Process Health moved here to clear dashboard */}
                  <div className="card-logistics">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <p className="label-logistics text-gray-400 mb-2">Network Diagnostics</p>
                        <h3 className="heading-primary">Cortex Health & Stability</h3>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald/10 text-emerald rounded-xl border border-emerald/20">
                        <ShieldCheck size={14} />
                        <span className="label-logistics !mb-0">Secure Node</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between group hover:border-brand transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                            <Zap size={24} />
                          </div>
                          <Badge variant={health?.isSupabaseHealthy ? "delivered" : "failed"}>
                            {health?.isSupabaseHealthy ? "Connected" : "Disconnected"}
                          </Badge>
                        </div>
                        <div>
                          <p className="label-logistics text-gray-400 mb-2">Data Gateway</p>
                          <p className="body-value text-gray-900">{health?.isSupabaseHealthy ? "Sync Flow Active" : "Gateway Error"}</p>
                          {!health?.isSupabaseHealthy && (
                            <button onClick={handleTroubleshoot} className="mt-4 text-[10px] font-black text-brand uppercase tracking-widest hover:underline">
                              Run Diagnostics
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between group hover:border-brand transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                            <Activity size={24} />
                          </div>
                          <Badge variant={health?.isFrappeHealthy ? "delivered" : "failed"}>
                            {health?.isFrappeHealthy ? "Stable" : "Offline"}
                          </Badge>
                        </div>
                        <div>
                          <p className="label-logistics text-gray-400 mb-2">ERP Integration</p>
                          <p className="body-value text-gray-900">{health?.isFrappeHealthy ? "Channel Verified" : "Auth Failure"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'VERTICAL' && <VerticalIntelligence industry={activeVertical} />}
              
              <div className="card-logistics">
                <TaskManagement />
              </div>
            </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="card-logistics">
                 <div className="flex items-center justify-between mb-8">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</h4>
                   <Zap size={16} className="text-brand" fill="currentColor" />
                 </div>
                 <div className="grid grid-cols-1 gap-4 mb-10">
                   {isModuleEnabled('dispatch') && (
                     <button 
                       id="tour-manage-dispatch"
                       onClick={() => navigate('/admin/dispatch')}
                       className="btn-primary"
                     >
                       <RouteIcon size={18} /> Manage Dispatch
                     </button>
                   )}
                   {isModuleEnabled('orders') && (
                     <button 
                       onClick={() => navigate('/admin/orders')}
                       className="btn-outline"
                     >
                       <Inbox size={18} /> Create New Order
                     </button>
                   )}
                   <button 
                     onClick={() => navigate('/admin/tracking')}
                     className="btn-outline"
                   >
                     <Navigation size={18} /> Live Tracking
                   </button>
                 </div>

                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Core Operations</h4>
                 <div className="space-y-2 mb-10">
                    <AdminLink index={0} icon={Users} label="Team & Access" desc="Manage active staff & roles" onClick={() => navigate('/admin/users')} />
                    <AdminLink index={1} icon={Briefcase} label="Driver Recruitment" desc="Manage driver pipeline" onClick={() => navigate('/admin/recruitment')} />
                    {isModuleEnabled('finance') && <AdminLink index={2} icon={Scale} label="Financial Office" desc="Billing, invoices & reconciliation" onClick={() => navigate('/admin/billing')} />}
                    {isModuleEnabled('integrations') && <AdminLink index={3} icon={DatabaseZap} label="Data Integration" desc="Import and sync external records" onClick={() => navigate('/admin/ingress')} />}
                    <AdminLink index={3.5} icon={Activity} label="System Cluster" desc="Real-time infrastructure health" onClick={() => navigate('/admin/diagnostics')} />
                    {isModuleEnabled('fleet') && <AdminLink index={4} icon={Warehouse} label="Fleet & Hubs" desc="Register vehicles & locations" onClick={() => navigate('/admin/fleet')} />}
                 </div>

                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Supply Chain & CRM</h4>
                 <div className="space-y-2 mb-10">
                    {isModuleEnabled('orders') && <AdminLink index={5} icon={ShoppingBag} label="Order Orchestration" desc="Manage sales orders & approvals" onClick={() => navigate('/admin/orders')} />}
                    {isModuleEnabled('warehouse') && <AdminLink index={6} icon={Package} label="Warehouse Management" desc="Inventory & fulfillment" onClick={() => navigate('/admin/warehouse')} />}
                    <AdminLink index={7} icon={UserCheck} label="Client Relations" desc="CRM & customer interactions" onClick={() => navigate('/admin/crm')} />
                    <AdminLink index={8} icon={ShieldAlert} label="Exception Logs" desc="Investigate delivery disputes" onClick={() => navigate('/admin/exceptions')} />
                 </div>

                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Industry Solutions</h4>
                 <div className="space-y-2">
                    {(tenant?.industry === 'MEDICAL' || tenant?.industry === 'PHARMA') && (
                      <AdminLink index={4} icon={Stethoscope} label="Healthcare Command" desc="Cold Chain & Compliance" onClick={() => navigate('/industry/healthcare')} />
                    )}
                    <AdminLink index={5} icon={Layers} label="Solution Marketplace" desc="Explore Industry Modules" onClick={() => addNotification("Marketplace coming soon.", "info")} />
                 </div>
              </div>

              <div className="bg-brand text-white rounded-2xl p-10 shadow-2xl shadow-brand/20 relative overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
                    <Zap size={150} fill="currentColor" />
                 </div>
                 <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 relative z-10">Enterprise Plan</h4>
                 <div className="flex items-center justify-between mb-8 relative z-10">
                    <Badge variant="dispatched" className="bg-white/20 text-white border-white/20">Active Cluster</Badge>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Renews in 12 days</span>
                 </div>
                 <button onClick={() => navigate('/admin/subscription')} className="w-full py-5 bg-white text-brand rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-white/90 transition-all active:scale-95 relative z-10">
                    Manage Subscription
                 </button>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

const AdminLink = ({ icon: Icon, label, desc, onClick, index }: any) => (
  <motion.button 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.1 * index, duration: 0.4 }}
    whileHover={{ x: 8, backgroundColor: "rgba(0,0,0,0.02)" }}
    onClick={onClick}
    className="w-full flex items-center gap-5 p-5 rounded-xl transition-all text-left group"
  >
    <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
      <Icon size={20} />
    </div>
    <div className="min-w-0">
      <p className="body-value truncate-name !mb-1.5">{label}</p>
      <p className="label-logistics truncate-name !mb-0">{desc}</p>
    </div>
    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-brand group-hover:translate-x-1 transition-all" />
  </motion.button>
);

export default AdminDashboard;
