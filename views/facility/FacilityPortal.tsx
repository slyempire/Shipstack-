
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useAppStore } from '../../store';
import { api } from '../../api';
import { useTenant } from '../../hooks/useTenant';
import { DeliveryNote, DNStatus, LogisticsType } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { 
  Warehouse, 
  Truck, 
  LogOut, 
  RefreshCw, 
  Box, 
  ClipboardCheck, 
  X, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Activity, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  MapPin, 
  Timer, 
  User as UserIcon,
  LayoutGrid,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Plus,
  TrendingUp
} from 'lucide-react';

const FacilityPortal: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addNotification } = useAppStore();
  const { tenant } = useTenant();
  
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK'>('TODAY');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadQueue();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  const loadQueue = async () => {
    if (!user || !tenant?.id) return;
    setLoading(true);
    try {
      const data = await api.getDeliveryNotes(tenant.id, user);
      setDns(data);
    } catch (error) {
      addNotification("Failed to load facility data", "error");
    } finally {
      setLoading(false);
    }
  };

  const inboundShipments = useMemo(() => {
    return dns.filter(d => d.type === LogisticsType.INBOUND);
  }, [dns]);

  const outboundShipments = useMemo(() => {
    return dns.filter(d => d.type === LogisticsType.OUTBOUND);
  }, [dns]);

  const bays = [
    { id: 1, status: 'LOADING', dn: 'DN-772' },
    { id: 2, status: 'EMPTY', dn: null },
    { id: 3, status: 'UNLOADING', dn: 'DN-881' },
    { id: 4, status: 'RESERVED', dn: 'DN-902' },
    { id: 5, status: 'EMPTY', dn: null },
    { id: 6, status: 'LOADING', dn: 'DN-102' },
    { id: 7, status: 'EMPTY', dn: null },
    { id: 8, status: 'EMPTY', dn: null },
  ];

  const getBayStatusColor = (status: string) => {
    switch (status) {
      case 'LOADING': return 'bg-brand text-white border-brand';
      case 'UNLOADING': return 'bg-amber text-white border-amber';
      case 'RESERVED': return 'bg-indigo-500 text-white border-indigo-500';
      default: return 'bg-navy text-white/20 border-white/5';
    }
  };

  return (
    <div className="min-h-screen bg-navy text-white font-sans flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-navy/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-brand rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/20">
            <Warehouse size={28} />
          </div>
          <div>
            <h1 className="heading-primary mb-1">
              {user?.company || 'Central Distribution'} Hub
            </h1>
            <div className="flex items-center gap-3">
              <p className="label-logistics !text-brand !text-[10px] !mb-0">Facility ID: {user?.facilityId || 'WH-NBO-01'}</p>
              <span className="h-1 w-1 bg-white/20 rounded-full" />
              <p className="label-logistics !text-[10px] !mb-0">{currentTime.toLocaleTimeString()} &bull; {currentTime.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 px-8 border-x border-white/5">
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">On-Duty Staff</p>
              <p className="text-lg font-black tracking-tighter">24 Agents</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Active Bays</p>
              <p className="text-lg font-black tracking-tighter text-brand">4 / 8</p>
            </div>
          </div>
          <button onClick={() => logout()} className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-red transition-all">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-10 max-w-[1600px] mx-auto w-full">
        {/* Quick Actions & Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="p-8 bg-brand rounded-[2.5rem] shadow-2xl shadow-brand/20 flex flex-col items-center gap-4 group active:scale-95 transition-all relative overflow-hidden">
              <Zap className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform" size={100} />
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center"><Plus size={28} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Log Incoming</span>
            </button>
            <button className="p-8 bg-charcoal border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-brand/50">
              <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand"><Truck size={28} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Ready for Dispatch</span>
            </button>
            <button className="p-8 bg-charcoal border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-emerald/50">
              <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-emerald"><CheckCircle2 size={28} /></div>
              <span className="text-xs font-black uppercase tracking-widest">Mark Bay Available</span>
            </button>
          </div>
          <div className="lg:col-span-4 bg-charcoal border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
            <Activity className="absolute -right-8 -bottom-8 opacity-5" size={160} />
            <div>
              <p className="label-logistics mb-2">Throughput Efficiency</p>
              <h3 className="text-4xl font-black tracking-tighter">94.2%</h3>
            </div>
            <div className="flex items-center gap-2 text-emerald mt-4">
              <TrendingUp size={16} />
              <span className="label-logistics !text-emerald !mb-0">+2.4% vs Yesterday</span>
            </div>
          </div>
        </section>

        {/* Main Operations Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Shipments Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex bg-charcoal p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setActiveTab('INBOUND')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'INBOUND' ? 'bg-brand text-white shadow-lg' : 'text-white/20 hover:text-white'}`}
                >
                  Inbound
                </button>
                <button 
                  onClick={() => setActiveTab('OUTBOUND')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OUTBOUND' ? 'bg-brand text-white shadow-lg' : 'text-white/20 hover:text-white'}`}
                >
                  Outbound
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-navy p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setTimeRange('TODAY')}
                    className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeRange === 'TODAY' ? 'bg-white/10 text-white' : 'text-white/20'}`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setTimeRange('WEEK')}
                    className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeRange === 'WEEK' ? 'bg-white/10 text-white' : 'text-white/20'}`}
                  >
                    This Week
                  </button>
                </div>
                <button onClick={loadQueue} className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="bg-charcoal rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-navy/50 border-b border-white/5">
                    <tr>
                      <th className="px-8 py-5 label-logistics opacity-20">Shipment</th>
                      <th className="px-8 py-5 label-logistics opacity-20">Origin / Dest</th>
                      <th className="px-8 py-5 label-logistics opacity-20">Priority</th>
                      <th className="px-8 py-5 label-logistics opacity-20">Status</th>
                      <th className="px-8 py-5 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(activeTab === 'INBOUND' ? inboundShipments : outboundShipments).map(dn => (
                      <tr key={dn.id} className="hover:bg-white/5 transition-all group cursor-pointer">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${dn.type === LogisticsType.INBOUND ? 'bg-indigo-500/10 text-indigo-400' : 'bg-brand/10 text-brand'}`}>
                              {dn.type === LogisticsType.INBOUND ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                            </div>
                            <div>
                              <p className="mono-id text-brand">{dn.externalId}</p>
                              <p className="label-logistics text-white/40 !mb-0">{dn.items.length} Items &bull; {dn.weightKg || 0}kg</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="body-value truncate-name max-w-[180px] !mb-1">{activeTab === 'INBOUND' ? dn.originName : dn.clientName}</p>
                          <p className="label-logistics text-white/40 truncate-name max-w-[200px] !mb-0">{activeTab === 'INBOUND' ? dn.originAddress : dn.address}</p>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={dn.priority.toLowerCase() as any}>{dn.priority}</Badge>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 bg-white/5 rounded-lg text-white/20 group-hover:text-brand transition-all">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bay Management */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex justify-between items-end px-2">
              <div>
                <h3 className="text-xl font-black tracking-tighter uppercase">Bay Management</h3>
                <p className="label-logistics">Real-time dock status</p>
              </div>
              <LayoutGrid size={20} className="text-white/20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {bays.map(bay => (
                <div key={bay.id} className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden group ${getBayStatusColor(bay.status)}`}>
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-2xl font-black tracking-tighter">0{bay.id}</span>
                    <button className="p-1.5 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <div className="relative z-10">
                    <p className="label-logistics opacity-60 !mb-1">{bay.status}</p>
                    <h4 className="body-value truncate-name">{bay.dn || 'Available'}</h4>
                  </div>
                  {bay.status !== 'EMPTY' && (
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform">
                      {bay.status === 'LOADING' ? <ArrowUpRight size={80} /> : <ArrowDownLeft size={80} />}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Staff Overview */}
            <div className="p-8 bg-charcoal border border-white/5 rounded-[2.5rem] space-y-6">
              <h4 className="label-logistics">Personnel Overview</h4>
              <div className="space-y-4">
                {[
                  { name: 'John Kamau', role: 'Bay Supervisor', status: 'Active' },
                  { name: 'Sarah Chen', role: 'Inventory Lead', status: 'On Break' },
                  { name: 'David Omondi', role: 'Gate Security', status: 'Active' },
                ].map((staff, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-navy/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-black text-xs">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="body-value !mb-0">{staff.name}</p>
                        <p className="label-logistics opacity-20 !mb-0">{staff.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald' : 'bg-amber'}`} />
                      <span className="label-logistics opacity-40 !mb-0">{staff.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                View Full Roster
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FacilityPortal;
