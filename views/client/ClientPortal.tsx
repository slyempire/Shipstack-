
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '../../store';
import { api } from '../../api';
import { useTenant } from '../../hooks/useTenant';
import { telemetryService } from '../../services/socket';
import { DeliveryNote, DNStatus, Vehicle } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import {
  Truck,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Phone,
  MessageSquare,
  History,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
  Radio
} from 'lucide-react';
import { formatDistanceToNow, addMinutes, format } from 'date-fns';

interface LivePosition {
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  timestamp: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeEta(position: LivePosition, destLat?: number, destLng?: number): Date | null {
  if (!destLat || !destLng) return null;
  const distKm = haversineKm(position.lat, position.lng, destLat, destLng);
  const speedKmh = position.speed > 2 ? position.speed : 30; // floor of 30 km/h for slow/stationary
  const etaMinutes = Math.round((distKm / speedKmh) * 60);
  return addMinutes(new Date(), etaMinutes);
}

const ClientPortal: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { tenant, formatCurrency } = useTenant();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackedDn, setTrackedDn] = useState<DeliveryNote | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [livePosition, setLivePosition] = useState<LivePosition | null>(null);
  const telemetryUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadClientData();
  }, [user]);

  const loadClientData = async () => {
    if (!user || !tenant?.id) return;
    try {
      const allDns = await api.getDeliveryNotes(tenant.id, user);
      // In a real app, we'd filter by clientId. For demo, we show all or a subset.
      setDns(allDns);
      const allVehicles = await api.getVehicles(tenant.id);
      setVehicles(allVehicles);
    } catch (error) {
      console.error("Failed to load client data", error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to live telemetry for the tracked shipment
  useEffect(() => {
    if (telemetryUnsub.current) {
      telemetryUnsub.current();
      telemetryUnsub.current = null;
    }
    setLivePosition(null);

    if (!trackedDn) return;

    // Seed with last known position if available
    if (trackedDn.lastLat && trackedDn.lastLng) {
      setLivePosition({ lat: trackedDn.lastLat, lng: trackedDn.lastLng, speed: 40, timestamp: new Date().toISOString() });
    }

    const handler = (data: any) => {
      if (data.dnId === trackedDn.id) {
        setLivePosition({ lat: data.lat, lng: data.lng, speed: data.speed ?? 0, heading: data.heading, timestamp: data.timestamp || new Date().toISOString() });
      }
    };
    telemetryService.onTelemetryUpdate(handler);

    return () => {
      telemetryUnsub.current = null;
    };
  }, [trackedDn?.id]);

  const liveEta = useMemo(() => {
    if (!livePosition || !trackedDn?.lat || !trackedDn?.lng) return null;
    return computeEta(livePosition, trackedDn.lat, trackedDn.lng);
  }, [livePosition, trackedDn]);

  const handleTrack = () => {
    if (!trackingNumber) return;
    setIsSearching(true);
    setTimeout(() => {
      const found = dns.find(d => d.externalId.includes(trackingNumber.toUpperCase()) || d.id === trackingNumber);
      setTrackedDn(found || null);
      setIsSearching(false);
    }, 800);
  };

  const getTimelineSteps = (status: DNStatus) => {
    const steps = [
      { id: 'DISPATCHED', label: 'Dispatched', icon: Package },
      { id: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
      { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Navigation },
      { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
    ];

    const statusMap: Record<DNStatus, number> = {
      [DNStatus.RECEIVED]: 0,
      [DNStatus.VALIDATED]: 0,
      [DNStatus.READY_FOR_DISPATCH]: 0,
      [DNStatus.DISPATCHED]: 1,
      [DNStatus.LOADED]: 1,
      [DNStatus.IN_TRANSIT]: 2,
      [DNStatus.DELIVERED]: 4,
      [DNStatus.COMPLETED]: 4,
      [DNStatus.INVOICED]: 4,
      [DNStatus.EXCEPTION]: 2, // Depends on where it happened
    };

    const currentStepIndex = statusMap[status] || 0;

    return steps.map((step, index) => {
      let state: 'completed' | 'current' | 'pending' = 'pending';
      if (index + 1 < currentStepIndex) state = 'completed';
      else if (index + 1 === currentStepIndex) state = 'current';
      
      // Special case for delivered
      if (currentStepIndex === 4 && index === 3) state = 'completed';

      return { ...step, state };
    });
  };

  const driverInfo = useMemo(() => {
    if (!trackedDn || !trackedDn.vehicleId) return null;
    return vehicles.find(v => v.id === trackedDn.vehicleId || v.plate === trackedDn.vehicleId);
  }, [trackedDn, vehicles]);

  return (
    <div className="min-h-screen bg-navy text-white font-sans flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center sticky top-0 z-30 bg-navy/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
            <Truck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="heading-primary mb-1">Shipstack Client</h1>
            <p className="label-logistics">Consignee Tracking Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <p className="body-value !mb-0">{user?.name}</p>
            <p className="label-logistics !mb-0">{user?.company || 'Enterprise Partner'}</p>
          </div>
          <button onClick={() => logout()} className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10 space-y-10">
        {/* Tracking Hero */}
        <section className="relative p-10 md:p-16 bg-charcoal rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Search size={200} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-6 leading-tight">
              Track your <span className="text-brand">Global</span> Shipments
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter Tracking Number (e.g. DN-772)..." 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  className="w-full h-16 bg-navy/50 border border-white/10 rounded-2xl pl-14 pr-6 text-sm font-bold placeholder:text-white/10 outline-none focus:border-brand transition-all"
                />
              </div>
              <button 
                onClick={handleTrack}
                disabled={isSearching}
                className="h-16 px-10 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="animate-spin" size={20} /> : 'Locate Shipment'}
              </button>
            </div>
          </div>
        </section>

        {/* Tracking Results */}
        {trackedDn ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Timeline & Status */}
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 bg-charcoal rounded-[2.5rem] border border-white/5 shadow-xl">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="label-logistics !text-brand mb-2">Shipment Status</p>
                    <h3 className="text-3xl font-black tracking-tighter uppercase">{trackedDn.status.replace('_', ' ')}</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <p className="label-logistics !mb-0">Estimated Arrival</p>
                      {livePosition && (
                        <span className="flex items-center gap-1 text-[8px] font-black text-brand uppercase tracking-widest animate-pulse">
                          <Radio size={9} /> Live
                        </span>
                      )}
                    </div>
                    {trackedDn.status === 'DELIVERED' || trackedDn.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-2 text-emerald">
                        <CheckCircle2 size={20} />
                        <span className="text-lg font-black tracking-tighter uppercase">Delivered</span>
                      </div>
                    ) : liveEta ? (
                      <div>
                        <div className="flex items-center gap-2 text-emerald">
                          <Clock size={20} />
                          <span className="text-2xl font-black tracking-tighter">{format(liveEta, 'HH:mm')}</span>
                        </div>
                        <p className="text-[9px] font-bold text-white/30 mt-1">
                          {formatDistanceToNow(liveEta, { addSuffix: true })}
                          {livePosition && ` · updated ${formatDistanceToNow(new Date(livePosition.timestamp), { addSuffix: true })}`}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40">
                        <Clock size={20} />
                        <span className="text-lg font-black tracking-tighter">Awaiting GPS</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative pt-10 pb-4">
                  <div className="absolute top-[52px] left-8 right-8 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand transition-all duration-1000" 
                      style={{ width: `${(getTimelineSteps(trackedDn.status).filter(s => s.state === 'completed').length / 3) * 100}%` }}
                    />
                  </div>
                  <div className="relative flex justify-between">
                    {getTimelineSteps(trackedDn.status).map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-4 relative z-10">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border-4 border-charcoal transition-all duration-500 ${
                          step.state === 'completed' ? 'bg-emerald text-white' : 
                          step.state === 'current' ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-110' : 
                          'bg-navy text-white/10 border-white/5'
                        }`}>
                          <step.icon size={20} />
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${step.state === 'pending' ? 'text-white/20' : 'text-white'}`}>{step.label}</p>
                          {step.state === 'completed' && <p className="text-[8px] font-bold text-emerald uppercase mt-1">Completed</p>}
                          {step.state === 'current' && <p className="text-[8px] font-bold text-brand uppercase mt-1 animate-pulse">In Progress</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FEATURE 4: Live Delivery Intelligence */}
                <div className="mt-12 pt-8 border-t border-white/5 relative">
                  {(api.getTenantPlan() === 'STARTER' || api.getTenantPlan() === 'GROWTH') && (
                    <div className="absolute inset-0 z-50 bg-charcoal/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                      <div className="bg-navy rounded-[2rem] p-6 max-w-sm shadow-2xl border border-white/10">
                        <div className="h-10 w-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Sparkles size={20} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Live Delivery Intel</h4>
                        <p className="text-xs text-white/40 font-medium mb-4">
                          Upgrade to SCALE to provide your clients with real-time AI velocity tracking and prediction intelligence.
                        </p>
                        <button 
                          onClick={() => window.location.href = '/admin/subscription'}
                          className="w-full py-3 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl"
                        >
                          View Scale Intelligence
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-brand" size={18} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Live Delivery Intelligence</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-navy/30 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Current Velocity</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black">42 km/h</span>
                        <span className="text-[8px] font-bold text-emerald uppercase mb-1">Optimal</span>
                      </div>
                    </div>
                    <div className="p-5 bg-navy/30 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Traffic Impact</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black">Low</span>
                        <span className="text-[8px] font-bold text-emerald uppercase mb-1">-4m Delay</span>
                      </div>
                    </div>
                    <div className="p-5 bg-navy/30 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Weather Status</p>
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-black">Clear</span>
                        <span className="text-[8px] font-bold text-emerald uppercase mb-1">No Impact</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-brand text-white rounded-lg flex items-center justify-center">
                        <Zap size={16} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-tight">AI Prediction: Delivery expected 6 minutes earlier than scheduled.</p>
                    </div>
                    <button className="text-[8px] font-black text-brand uppercase tracking-widest hover:underline">View Details</button>
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="p-8 bg-charcoal rounded-[2.5rem] border border-white/5 shadow-xl">
                <h4 className="label-logistics mb-8">Manifest Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="label-logistics mb-2">Origin</p>
                    <p className="body-value truncate-name">{trackedDn.originName || 'Central Hub'}</p>
                  </div>
                  <div>
                    <p className="label-logistics mb-2">Destination</p>
                    <p className="body-value truncate-name">{trackedDn.clientName}</p>
                  </div>
                  <div>
                    <p className="label-logistics mb-2">Weight</p>
                    <p className="body-value">{trackedDn.weightKg || '--'} KG</p>
                  </div>
                  <div>
                    <p className="label-logistics mb-2">Priority</p>
                    <Badge variant={trackedDn.priority.toLowerCase() as any}>{trackedDn.priority}</Badge>
                  </div>
                </div>
                <div className="mt-10 pt-8 border-t border-white/5">
                   <p className="label-logistics mb-4">Items in Shipment</p>
                   <div className="space-y-3">
                      {trackedDn.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-navy/30 rounded-xl border border-white/5">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-white/40">
                                 <Package size={14} />
                              </div>
                              <span className="body-value truncate-name max-w-[150px]">{item.name}</span>
                           </div>
                           <span className="label-logistics !text-brand !mb-0">{item.qty} {item.unit}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Driver & Support */}
            <div className="lg:col-span-4 space-y-8">
              {/* Driver Card */}
              <div className="p-8 bg-charcoal rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <ShieldCheck size={160} />
                </div>
                <h4 className="label-logistics mb-8">Assigned Courier</h4>
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-20 w-20 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-3xl font-black">
                    {trackedDn.driverId?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h5 className="body-value !text-xl !mb-1">Driver {trackedDn.driverId?.split('-')[1] || '772'}</h5>
                    <p className="mono-id opacity-40">{driverInfo?.plate || 'KDH 281X'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-navy/50 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="label-logistics !mb-0">Vehicle Type</span>
                    <span className="body-value !text-[10px]">{driverInfo?.type || 'Light Truck'}</span>
                  </div>
                  <div className="p-4 bg-navy/50 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="label-logistics !mb-0">Safety Rating</span>
                    <div className="flex items-center gap-1 text-emerald">
                      <ShieldCheck size={12} />
                      <span className="body-value !text-[10px]">4.9/5.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="p-8 bg-brand rounded-[2.5rem] text-white shadow-2xl shadow-brand/20 relative overflow-hidden">
                <Zap className="absolute -right-8 -bottom-8 opacity-10" size={120} />
                <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Need Assistance?</h4>
                <p className="text-white/60 text-xs font-bold uppercase tracking-tight mb-8 leading-relaxed">Our dispatch team is available 24/7 for real-time support.</p>
                <div className="space-y-3">
                  <button className="w-full h-14 bg-white text-brand rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <Phone size={16} /> Call Dispatch
                  </button>
                  <button className="w-full h-14 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 backdrop-blur-md active:scale-95 transition-all">
                    <MessageSquare size={16} /> Live Chat
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : trackingNumber && !isSearching ? (
          <div className="py-20 text-center bg-charcoal rounded-[3rem] border border-dashed border-white/10 animate-in fade-in">
            <AlertCircle size={64} className="mx-auto mb-6 text-red opacity-20" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Shipment Not Found</h3>
            <p className="label-logistics">Please verify the tracking number and try again.</p>
          </div>
        ) : null}

        {/* Recent History */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase">Delivery History</h3>
              <p className="label-logistics">Your recent logistics activity</p>
            </div>
            <button className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-charcoal rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-navy/50 border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 label-logistics opacity-20">Shipment ID</th>
                    <th className="px-8 py-5 label-logistics opacity-20">Date</th>
                    <th className="px-8 py-5 label-logistics opacity-20">Destination</th>
                    <th className="px-8 py-5 label-logistics opacity-20">Status</th>
                    <th className="px-8 py-5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dns.slice(0, 5).map(dn => (
                    <tr key={dn.id} className="hover:bg-white/5 transition-all group cursor-pointer" onClick={() => { setTrackingNumber(dn.externalId); handleTrack(); }}>
                      <td className="px-8 py-6">
                        <span className="mono-id text-brand">{dn.externalId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="body-value opacity-60">{new Date(dn.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="body-value opacity-80 truncate-name max-w-[200px]">{dn.address}</span>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <ChevronRight size={18} className="text-white/10 group-hover:text-brand transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="p-10 border-t border-white/5 bg-navy/50 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-brand" />
            <span className="text-xs font-black uppercase tracking-tighter">Shipstack Logistics OS</span>
          </div>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">© 2026 Shipstack Global. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-colors">Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
