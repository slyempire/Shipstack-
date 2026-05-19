
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { DeliveryNote, DNStatus, LatLngTuple } from '../../types';
import MapEngine from '../../components/MapEngine';
import { Badge } from '../../packages/ui/Badge';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  ArrowLeft,
  Search,
  Zap,
  Activity,
  Phone,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TrackPackage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dn, setDn] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState(id || '');

  useEffect(() => {
    if (id) {
      loadDn(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadDn = async (dnId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDeliveryNote(dnId);
      if (data) {
        setDn(data);
      } else {
        setError("Shipment not found. Please verify your tracking ID.");
      }
    } catch (err) {
      setError("Unable to retrieve tracking data. System uplink failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track/${trackingId.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-center">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-brand blur-[100px] opacity-20 animate-pulse" />
          <div className="h-40 w-40 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center relative backdrop-blur-3xl overflow-hidden">
             <Truck size={64} className="text-white animate-bounce" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 animate-pulse">Syncing Telemetry</h2>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Locating asset on regional grid...</p>
      </div>
    );
  }

  if (!dn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl text-center">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
            <Search size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Track Package</h2>
          <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed uppercase">
            Enter your 10-digit tracking ID or reference number to view real-time delivery progress.
          </p>
          <form onSubmit={handleSearch} className="space-y-4">
            <input 
              type="text" 
              placeholder="e.g. DN-12345"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl text-center font-black text-lg outline-none transition-all uppercase"
            />
            <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
              Locate Shipment
            </button>
          </form>
          {error && <p className="mt-6 text-xs font-black text-red-500 uppercase tracking-widest">{error}</p>}
          <button 
            onClick={() => navigate('/')}
            className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto hover:text-brand transition-all"
          >
            <ArrowLeft size={12} /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isDelivered = dn.status === DNStatus.DELIVERED || dn.status === DNStatus.COMPLETED;
  const isInTransit = dn.status === DNStatus.IN_TRANSIT;
  const driverPos: LatLngTuple | undefined = dn.lastLat && dn.lastLng ? [dn.lastLat, dn.lastLng] : undefined;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Mini Nav */}
      <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-12 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Truck size={20} />
          </div>
          <span className="text-sm font-black uppercase tracking-tighter text-slate-900">Shipstack Track</span>
        </div>
        <button 
          onClick={() => setDn(null)}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-all"
        >
          New Search
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Sidebar Info */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="p-8 sm:p-12 overflow-y-auto no-scrollbar flex-1">
             <div className="mb-12">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Shipment Status</span>
                   <Badge variant={isDelivered ? 'delivered' : isInTransit ? 'transit' : 'neutral'}>
                      {dn.status}
                   </Badge>
                </div>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                   REF-{dn.externalId}
                </h2>
                <div className="flex items-center gap-2 text-slate-400">
                   <Clock size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Est. Delivery: Today by 18:00</span>
                </div>
             </div>

             <div className="space-y-10 relative">
                {/* Visual Timeline */}
                <div className="absolute left-4 top-1.5 bottom-1.5 w-0.5 bg-slate-100" />
                
                <div className="relative pl-12">
                   <div className={`absolute left-2.5 top-1 h-3.5 w-3.5 rounded-full border-4 border-white shadow-sm transition-all ${isDelivered || isInTransit ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
                   <h4 className="text-xs font-black text-slate-900 uppercase mb-1">Pick up initiated</h4>
                   <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">Central Hub Distribution Center</p>
                   <p className="text-[9px] font-black text-slate-300 mt-2">09:42 AM · 12 MAY 2026</p>
                </div>

                <div className="relative pl-12">
                   <div className={`absolute left-2.5 top-1 h-3.5 w-3.5 rounded-full border-4 border-white shadow-sm transition-all ${isInTransit ? 'bg-blue-500 scale-125 animate-pulse' : isDelivered ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                   <h4 className="text-xs font-black text-slate-900 uppercase mb-1">In transit</h4>
                   <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">Last-mile cluster deployment active</p>
                   {isInTransit && (
                     <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <Activity className="text-blue-500 animate-pulse" size={16} />
                        <span className="text-[9px] font-black text-blue-600 uppercase">Live telemetry active</span>
                     </div>
                   )}
                </div>

                <div className="relative pl-12">
                   <div className={`absolute left-2.5 top-1 h-3.5 w-3.5 rounded-full border-4 border-white shadow-sm transition-all ${isDelivered ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
                   <h4 className={`text-xs font-black uppercase mb-1 ${isDelivered ? 'text-slate-900' : 'text-slate-300'}`}>Delivered</h4>
                   <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">Recipient verification signature on file</p>
                </div>
             </div>

             <div className="mt-16 pt-10 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-6 rounded-[2rem]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Recipient</p>
                      <h5 className="text-sm font-black text-slate-900 uppercase leading-tight truncate-name">{dn.clientName}</h5>
                      <div className="flex items-center gap-2 mt-2">
                         <MapPin size={12} className="text-brand" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase truncate-name">{dn.address}</span>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-[2rem]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Manifest Info</p>
                      <h5 className="text-sm font-black text-slate-900 uppercase leading-tight">Cluster Node 4</h5>
                      <div className="flex items-center gap-2 mt-2">
                         <Zap size={12} className="text-brand" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Priority One</span>
                      </div>
                   </div>
                </div>

                <div className="mt-8 bg-slate-900 rounded-[2.5rem] p-8 text-white">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                         <Activity size={24} className="text-brand" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Live Telemetry</p>
                         <h5 className="text-lg font-black uppercase tracking-tight">Signal: Nominal</h5>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-white/50 uppercase">Update Latency</span>
                         <span className="text-[10px] font-black text-brand uppercase tracking-widest">3.2 Seconds</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-brand w-[92%]" />
                      </div>
                   </div>
                </div>

                <div className="mt-10 flex gap-3">
                   <button className="flex-1 flex items-center justify-center gap-2 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand/30 transition-all shadow-sm">
                      <Phone size={14} /> Call Driver
                   </button>
                   <button className="flex-1 flex items-center justify-center gap-2 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-brand/30 transition-all shadow-sm">
                      <MessageSquare size={14} /> Secure Chat
                   </button>
                </div>
             </div>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Package size={16} className="text-slate-300" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 Shipstack Core</span>
             </div>
             <div className="flex gap-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Privacy</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Support</span>
             </div>
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-200 relative">
          {!isDelivered ? (
            <MapEngine 
              dns={[dn]}
              focusedDnId={dn.id}
              className="h-full w-full"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white p-12 text-center">
               <div className="h-32 w-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100/50">
                  <CheckCircle2 size={64} />
               </div>
               <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">Parcel Delivered</h3>
               <p className="text-xl text-slate-400 font-bold uppercase tracking-tight max-w-md mx-auto leading-tight">
                  Successfully reached destination cluster. Package verification complete.
               </p>
            </div>
          )}

          {isInTransit && (
            <div className="absolute top-10 right-10 z-20">
               <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-6 animate-in slide-in-from-top-8">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-brand">Live Trace</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-right">
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ground Speed</p>
                     <p className="text-xl font-black italic">42 KM/H</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackPackage;
