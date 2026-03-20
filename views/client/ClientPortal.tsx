
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Vehicle, Facility } from '../../types';
import MapEngine from '../../components/MapEngine';
import { Badge } from '../../packages/ui/Badge';
import { 
  Truck, 
  DollarSign, 
  BarChart3, 
  Map as MapIcon, 
  History, 
  LogOut, 
  ArrowUpRight, 
  Activity, 
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Wallet
} from 'lucide-react';

const TransporterPortal: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'FLEET'>('OVERVIEW');
  const [search, setSearch] = useState('');
  const [focusedDnId, setFocusedDnId] = useState<string | undefined>();

  useEffect(() => {
    loadTransporterData();
    const interval = setInterval(loadTransporterData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadTransporterData = async () => {
    if (!user) return;
    const [tripsData, vehiclesData, facData] = await Promise.all([
      api.getDeliveryNotes(user),
      api.getVehicles(),
      api.getFacilities()
    ]);
    setDns(tripsData);
    setVehicles(vehiclesData.filter(v => v.ownerId === user.transporterId));
    setFacilities(facData);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalEarnings = dns
      .filter(d => [DNStatus.COMPLETED, DNStatus.INVOICED, DNStatus.DELIVERED].includes(d.status))
      .reduce((acc, curr) => acc + (curr.rate || 0), 0);
    
    const activeTrips = dns.filter(d => d.status === DNStatus.IN_TRANSIT).length;
    const completedTrips = dns.filter(d => [DNStatus.COMPLETED, DNStatus.INVOICED].includes(d.status)).length;
    
    return { totalEarnings, activeTrips, completedTrips };
  }, [dns]);

  const filteredDns = dns.filter(d => 
    d.externalId.toLowerCase().includes(search.toLowerCase()) || 
    d.vehicleId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-brand text-white px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-brand-accent rounded-xl flex items-center justify-center font-black">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">{user?.company}</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase">Fleet Owner Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-white/5 p-1 rounded-xl">
            {(['OVERVIEW', 'LEDGER', 'FLEET'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-brand shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => logout()} className="text-white/40 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-8 space-y-8 pb-20">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MTD Earnings</p>
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mt-4">${stats.totalEarnings.toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                  <ArrowUpRight size={12} /> +12% vs last month
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trips Performed</p>
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={16} /></div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mt-4">{stats.completedTrips}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Closed Manifests</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</p>
                   <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><MapIcon size={16} /></div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mt-4">{stats.activeTrips}</h3>
                <p className="text-[10px] font-bold text-cyan-600 mt-2 uppercase animate-pulse">Live Telemetry active</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</p>
                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BarChart3 size={16} /></div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mt-4">84%</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Asset Efficiency</p>
              </div>
            </div>

            {/* Main View Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               {/* Live Movements */}
               <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <MapIcon size={14} className="text-brand-accent" /> Fleet Live Tracking
                    </h4>
                    <button onClick={loadTransporterData} className="p-2 text-slate-400 hover:text-brand transition-colors">
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="flex-1 p-0 relative min-h-[400px]">
                     <MapEngine 
                      dns={dns.filter(d => d.status === DNStatus.IN_TRANSIT)} 
                      facilities={facilities}
                      focusedDnId={focusedDnId}
                      className="rounded-b-3xl"
                     />
                  </div>
               </div>

               {/* Notifications / Alerts */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="bg-brand text-white p-8 rounded-3xl shadow-xl shadow-brand/20 relative overflow-hidden">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pending Settlement</p>
                     <h4 className="text-2xl font-black mb-6">$4,120.00</h4>
                     <button className="w-full bg-white text-brand py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Wallet size={16} /> Settlement Center
                     </button>
                     <BarChart3 className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Active Movements</h4>
                     <div className="space-y-4">
                        {dns.filter(d => d.status === DNStatus.IN_TRANSIT).length > 0 ? (
                          dns.filter(d => d.status === DNStatus.IN_TRANSIT).map(dn => (
                            <div 
                              key={dn.id} 
                              onClick={() => setFocusedDnId(dn.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${focusedDnId === dn.id ? 'bg-brand/5 border-brand-accent' : 'bg-slate-50 border-slate-100'}`}
                            >
                               <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-brand-accent shadow-sm">
                                  <Truck size={20} />
                               </div>
                               <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-slate-900 leading-none mb-1 truncate">{dn.clientName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{dn.vehicleId}</p>
                               </div>
                               <ChevronRight size={16} className="text-slate-300" />
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                             <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active units</p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Usage Ledger</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit trail of all performed trips and calculated payouts</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter by Trip ID or Vehicle..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Trip / ID</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Usage Date</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Payout Rate</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Settlement</th>
                    <th className="px-8 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredDns.length === 0 ? (
                     <tr><td colSpan={6} className="p-20 text-center text-[10px] font-black text-slate-300 uppercase">No usage data found</td></tr>
                   ) : (
                     filteredDns.map(dn => (
                       <tr key={dn.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-8 py-6">
                             <p className="font-mono text-xs font-black text-brand uppercase">{dn.externalId}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{dn.clientName}</p>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <Truck size={14} className="text-brand-accent" />
                                <span className="text-xs font-black text-slate-700">{dn.vehicleId || 'Allocating...'}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <p className="text-xs font-bold text-slate-600">{new Date(dn.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-sm font-black text-slate-900">${dn.rate?.toLocaleString() || '0.00'}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <Badge variant={dn.status === DNStatus.INVOICED ? 'invoiced' : 'dispatched'}>
                                {dn.status === DNStatus.INVOICED ? 'Paid' : 'Pending'}
                             </Badge>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="p-2 text-slate-300 hover:text-brand opacity-0 group-hover:opacity-100 transition-all">
                                <ChevronRight size={18} />
                             </button>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'FLEET' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-8">
            {vehicles.map(v => (
              <div key={v.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-brand-accent transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${v.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Truck size={28} />
                  </div>
                  <Badge variant={v.status === 'ACTIVE' ? 'delivered' : 'neutral'}>{v.status}</Badge>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{v.type}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-8">{v.plate}</h3>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Capacity</p>
                       <p className="text-xs font-black text-slate-700">{v.capacityKg / 1000} Tons</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Owner ID</p>
                       <p className="text-xs font-black text-slate-700">{v.ownerId}</p>
                    </div>
                  </div>
                </div>
                <Activity size={120} className="absolute -right-8 -bottom-8 text-slate-50 opacity-10 group-hover:text-brand-accent/5 transition-all" />
              </div>
            ))}
            <button className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-brand hover:border-brand transition-all group">
               <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest">Register New Unit</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TransporterPortal;
