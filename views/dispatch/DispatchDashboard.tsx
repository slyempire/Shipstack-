
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility } from '../../types';
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
  Zap
} from 'lucide-react';

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

const DispatchDashboard: React.FC = () => {
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const data = await api.getDeliveryNotes();
    setDns(data);
    setLoading(false);
  };

  const getStatusVariant = (status: DNStatus) => {
    const map: Record<DNStatus, any> = {
      [DNStatus.RECEIVED]: 'received',
      [DNStatus.VALIDATED]: 'neutral',
      [DNStatus.READY_FOR_DISPATCH]: 'neutral',
      [DNStatus.DISPATCHED]: 'dispatched',
      [DNStatus.LOADED]: 'loaded',
      [DNStatus.IN_TRANSIT]: 'transit',
      [DNStatus.DELIVERED]: 'delivered',
      [DNStatus.COMPLETED]: 'delivered',
      [DNStatus.INVOICED]: 'invoiced',
      [DNStatus.EXCEPTION]: 'exception',
    };
    return map[status] || 'neutral';
  };

  return (
    <Layout title="Dispatcher Command Center">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Operational Overview</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time logistics flow monitoring</p>
           </div>
           <button 
             onClick={() => navigate('/admin/dispatch')}
             className="bg-brand text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-brand/90 transition-all active:scale-95"
           >
             <Plus size={16} /> New Run
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Incoming Orders" value={dns.filter(d => d.status === DNStatus.RECEIVED).length} icon={Inbox} color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" subValue="Awaiting Validation" />
          <StatCard title="Ready for Dispatch" value={dns.filter(d => d.status === DNStatus.READY_FOR_DISPATCH).length} icon={Zap} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" subValue="Fulfilled & Packed" />
          <StatCard title="Active In-Transit" value={dns.filter(d => d.status === DNStatus.IN_TRANSIT).length} icon={Navigation} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" subValue="Live Tracking Active" />
          <StatCard title="Critical Exceptions" value={dns.filter(d => d.status === DNStatus.EXCEPTION).length} icon={AlertTriangle} color="bg-red-50 dark:bg-red-900/20 text-logistics-red" subValue="Immediate Action" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Active Queue */}
           <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-brand-accent" /> Live Order Queue
                </h3>
                <button onClick={loadData} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : 'text-slate-400'} />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 {dns.filter(d => [DNStatus.RECEIVED, DNStatus.VALIDATED, DNStatus.READY_FOR_DISPATCH, DNStatus.EXCEPTION].includes(d.status)).slice(0, 6).map(dn => (
                    <div key={dn.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${dn.status === DNStatus.EXCEPTION ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                             <Package size={20} />
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">DN-{dn.externalId}</span>
                                <Badge variant={getStatusVariant(dn.status)} className="scale-75 origin-left">{dn.status}</Badge>
                             </div>
                             <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-none mb-1">{dn.clientName}</p>
                             <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-tight">{dn.address}</p>
                          </div>
                       </div>
                       <button onClick={() => navigate(`/admin/trip/${dn.id}`)} className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-600 group-hover:text-brand group-hover:bg-brand/5 transition-all">
                          <ChevronRight size={16} />
                       </button>
                    </div>
                 ))}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                 <button onClick={() => navigate('/admin/queue')} className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline">View Full Queue</button>
              </div>
           </div>

           {/* Quick Actions & Reminders */}
           <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-8 text-white shadow-2xl">
                 <h4 className="text-lg font-black uppercase tracking-tighter mb-6">Dispatcher Toolkit</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <ActionButton icon={RouteIcon} label="Optimize Routes" onClick={() => navigate('/admin/dispatch')} />
                    <ActionButton icon={Truck} label="Fleet Status" onClick={() => navigate('/admin/fleet')} />
                    <ActionButton icon={Navigation} label="Live Map" onClick={() => navigate('/admin/tracking')} />
                    <ActionButton icon={AlertTriangle} label="Resolve Alerts" onClick={() => navigate('/admin/exceptions')} />
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h4>
                 <div className="space-y-6">
                    <ActivityItem 
                      icon={CheckCircle2} 
                      color="text-emerald-500" 
                      title="Run Manifested" 
                      desc="TRP-9021 assigned to Driver John Doe" 
                      time="12 mins ago" 
                    />
                    <ActivityItem 
                      icon={AlertTriangle} 
                      color="text-amber-500" 
                      title="Exception Raised" 
                      desc="DN-4421: Address not found in Syokimau" 
                      time="45 mins ago" 
                    />
                    <ActivityItem 
                      icon={Truck} 
                      color="text-blue-500" 
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
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
  >
    <Icon size={24} className="text-brand-accent group-hover:scale-110 transition-transform" />
    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{label}</span>
  </button>
);

const ActivityItem = ({ icon: Icon, color, title, desc, time }: any) => (
  <div className="flex gap-4">
    <div className={`h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${color} shrink-0`}>
      <Icon size={14} />
    </div>
    <div className="min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</p>
        <span className="text-[8px] font-bold text-slate-400 uppercase">{time}</span>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate">{desc}</p>
    </div>
  </div>
);

const CheckCircle2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default DispatchDashboard;
