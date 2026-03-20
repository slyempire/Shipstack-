
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility } from '../../types';
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
  Route as RouteIcon
} from 'lucide-react';

import { useTenant } from '../../hooks/useTenant';

const ChecklistItem = ({ icon: Icon, title, desc, done, onClick }: { 
  icon: any, 
  title: string, 
  desc: string, 
  done: boolean,
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-2xl border transition-all text-left group flex flex-col h-full ${
      done 
        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' 
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-brand/30 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-brand'}`}>
        <Icon size={20} />
      </div>
      {done ? (
        <CheckCircle size={18} className="text-emerald-500" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-slate-100 dark:border-slate-700 group-hover:border-brand/30" />
      )}
    </div>
    <h4 className={`text-xs font-black uppercase tracking-tight mb-1 ${done ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
      {title}
    </h4>
    <p className={`text-[10px] leading-relaxed ${done ? 'text-emerald-600/70 dark:text-emerald-400/60' : 'text-slate-400'}`}>
      {desc}
    </p>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
      </div>
    </div>
    {subValue && (
      <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subValue}</span>
      </div>
    )}
  </div>
);

const AdminDashboard: React.FC = () => {
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const { isModuleEnabled } = useTenant();

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [data, facs] = await Promise.all([api.getDeliveryNotes(), api.getFacilities()]);
      setDns(Array.isArray(data) ? data : []);
      setFacilities(Array.isArray(facs) ? facs : []);
    } catch (err) {
      console.error("AdminDashboard: Failed to load data", err);
      addNotification("Failed to synchronize network data.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Logistics Command Center">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-brand" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Network Health...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Logistics Command Center">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Network Health & Governance</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional platform oversight</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">All Systems Nominal</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Volume" value={dns.length} icon={Inbox} color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" subValue="Manifests Processed" />
          {isModuleEnabled('fleet') && <StatCard title="Active Pilots" value="42" icon={Users} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" subValue="Currently On-Duty" />}
          <StatCard title="Network Uptime" value="99.9%" icon={Activity} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" subValue="Last 30 Days" />
          {isModuleEnabled('finance') && <StatCard title="Settlements (MTD)" value="$12.4k" icon={DollarSign} color="bg-brand/5 dark:bg-brand/10 text-brand" subValue="Projected $15k" />}
        </div>

        {/* Quick Start Checklist for New Users */}
        {dns.length === 0 && (
          <div className="bg-brand/5 dark:bg-brand/10 border border-brand/10 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Quick Start Guide</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete these steps to launch your operations</p>
              </div>
              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.generateSampleData();
                    addNotification("Sample data generated successfully!", "success");
                    loadData();
                  } catch (err) {
                    addNotification("Failed to generate sample data.", "error");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-accent transition-all flex items-center gap-2"
              >
                <Zap size={14} fill="currentColor" /> Generate Sample Data
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ChecklistItem 
                icon={Truck} 
                title="Register Fleet" 
                desc="Add your first vehicle to the network" 
                done={false}
                onClick={() => navigate('/admin/fleet')}
              />
              <ChecklistItem 
                icon={Warehouse} 
                title="Create Hubs" 
                desc="Define your distribution facilities" 
                done={facilities.length > 0}
                onClick={() => navigate('/admin/fleet')}
              />
              <ChecklistItem 
                icon={DatabaseZap} 
                title="Import Data" 
                desc="Upload your delivery notes via CSV" 
                done={dns.length > 0}
                onClick={() => navigate('/admin/ingress')}
              />
              <ChecklistItem 
                icon={Users} 
                title="Onboard Drivers" 
                desc="Invite pilots to the driver portal" 
                done={false}
                onClick={() => navigate('/admin/users')}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Global Live View */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative flex flex-col h-[500px]">
                  <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 pointer-events-auto shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      Global Network Activity
                    </div>
                  </div>
                  
                  <MapEngine 
                    dns={dns.filter(d => d.status === DNStatus.IN_TRANSIT)} 
                    facilities={facilities} 
                  />
               </div>

               {/* Process Health & Stabilization Monitoring */}
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Health Monitoring</h4>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Stabilization & Service Reliability</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      <ShieldCheck size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Active Guard</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:border-brand transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-brand shadow-sm">
                          <Zap size={20} />
                        </div>
                        <Badge variant="delivered" className="scale-75 origin-right">Connected</Badge>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Socket.io Gateway</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Real-time Sync Active</p>
                        <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[98%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:border-brand transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-brand-accent shadow-sm">
                          <Activity size={20} />
                        </div>
                        <Badge variant="delivered" className="scale-75 origin-right">Stable</Badge>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Telemetry Fallback</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">HTTP Redundancy Ready</p>
                        <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:border-brand transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                          <DatabaseZap size={20} />
                        </div>
                        <Badge variant="neutral" className="scale-75 origin-right">Optimized</Badge>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Process Stabilization</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Queue Reconciliation</p>
                        <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[85%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Stabilization</h4>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">API Key Health</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">0 Security Exceptions</p>
                       </div>
                       <ShieldCheck size={20} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Bulk Ingress Status</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">99.8% Success Rate</p>
                       </div>
                       <DatabaseZap size={20} className="text-brand" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">ERP Sync Latency</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">142ms Average</p>
                       </div>
                       <RefreshCw size={20} className="text-slate-400" />
                    </div>
                  </div>
               </div>
            </div>

           {/* Admin Quick Links & Actions */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</h4>
                   <Zap size={14} className="text-brand-accent" fill="currentColor" />
                 </div>
                 <div className="grid grid-cols-1 gap-3 mb-8">
                   {isModuleEnabled('dispatch') && (
                     <button 
                       onClick={() => navigate('/admin/dispatch')}
                       className="w-full flex items-center justify-center gap-3 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-brand/20 transition-all active:scale-95"
                     >
                       <RouteIcon size={16} /> Create Delivery Run
                     </button>
                   )}
                   {isModuleEnabled('orders') && (
                     <button 
                       onClick={() => navigate('/admin/orders')}
                       className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                     >
                       <Inbox size={16} /> New Order
                     </button>
                   )}
                 </div>

                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Administrative Pillars</h4>
                 <div className="space-y-4">
                    <AdminLink icon={Users} label="User Management" desc="RBAC & Access Control" onClick={() => navigate('/admin/users')} />
                    {isModuleEnabled('finance') && <AdminLink icon={Scale} label="Billing & Invoicing" desc="Commercial Reconciliation" onClick={() => navigate('/admin/billing')} />}
                    {isModuleEnabled('integrations') && <AdminLink icon={DatabaseZap} label="Data Ingress" desc="Pipeline & API Health" onClick={() => navigate('/admin/ingress')} />}
                    {isModuleEnabled('fleet') && <AdminLink icon={Warehouse} label="Fleet & Network" desc="Asset & Facility Registry" onClick={() => navigate('/admin/fleet')} />}
                 </div>
              </div>

              <div className="bg-brand rounded-[2rem] p-8 text-white shadow-xl">
                 <h4 className="text-lg font-black uppercase tracking-tighter mb-4">Subscription Plan</h4>
                 <div className="flex items-center justify-between mb-6">
                    <Badge variant="dispatched" className="bg-white/20 text-white border-white/20">Enterprise</Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Renews in 12 days</span>
                 </div>
                 <button onClick={() => navigate('/admin/subscription')} className="w-full py-4 bg-white text-brand rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all">
                    Manage Subscription
                 </button>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

const AdminLink = ({ icon: Icon, label, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
  >
    <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{label}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase truncate leading-none">{desc}</p>
    </div>
    <ChevronRight size={14} className="ml-auto text-slate-200 dark:text-slate-700 group-hover:text-brand transition-all" />
  </button>
);

export default AdminDashboard;
