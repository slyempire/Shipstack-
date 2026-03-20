
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility, LatLngTuple } from '../../types';
import MapEngine from '../../components/MapEngine';
import { Badge } from '../../packages/ui/Badge';
import { isDeviated, findNearestPointIndex } from '../../utils/geo';
import { useAppStore } from '../../store';
import { 
  Truck, 
  Navigation, 
  ChevronRight, 
  Activity, 
  Clock, 
  Search, 
  MapPin, 
  ShieldAlert, 
  ToggleRight, 
  ToggleLeft,
  RotateCw,
  Zap,
  Map as MapIcon
} from 'lucide-react';

const LiveTracking: React.FC = () => {
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedDnId, setFocusedDnId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [followDriver, setFollowDriver] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [isRerouting, setIsRerouting] = useState<string | null>(null);

  // Debounce for re-routing to avoid spamming engine
  const lastRerouteTime = useRef<Record<string, number>>({});

  useEffect(() => {
    loadBaseData();
    const interval = setInterval(pollTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBaseData = async () => {
    const [facs, allDns] = await Promise.all([api.getFacilities(), api.getDeliveryNotes()]);
    setFacilities(facs);
    setDns(processDnsForUI(allDns));
    setLoading(false);
  };

  const processDnsForUI = (items: DeliveryNote[]) => {
    return items.map(dn => {
      if (dn.status === DNStatus.IN_TRANSIT && dn.routeGeometry && dn.lastLat && dn.lastLng) {
        const pos: LatLngTuple = [dn.lastLat, dn.lastLng];
        const deviated = isDeviated(pos, dn.routeGeometry.coordinates);
        return { ...dn, isDeviated: deviated };
      }
      return dn;
    });
  };

  const pollTelemetry = async () => {
    const allDns = await api.getDeliveryNotes();
    const processed = processDnsForUI(allDns);
    setDns(processed);

    // Auto-reroute logic for deviated units
    processed.forEach(async dn => {
      if (dn.status === DNStatus.IN_TRANSIT && dn.isDeviated && dn.lastLat && dn.lastLng) {
        const now = Date.now();
        const lastReroute = lastRerouteTime.current[dn.id] || 0;
        
        // Auto-reroute throttle: 45 seconds to allow pilot to correct or for sync to stabilize
        if (now - lastReroute > 45000) {
          handleReroute(dn, [dn.lastLat, dn.lastLng], true);
        }
      }
    });
  };

  const handleReroute = async (dn: DeliveryNote, currentPos: LatLngTuple, isAuto = false) => {
    if (isRerouting === dn.id) return;
    setIsRerouting(dn.id);
    lastRerouteTime.current[dn.id] = Date.now();
    
    try {
      if (!isAuto) {
        addNotification(`Manual reroute initiated for REF-${dn.externalId}...`, 'info');
      }
      
      const newRoute = await api.getRoute(currentPos, [dn.lat!, dn.lng!]);
      await api.updateDNStatus(dn.id, DNStatus.IN_TRANSIT, { 
        routeGeometry: newRoute,
        notes: `${isAuto ? 'Auto' : 'Dispatcher'} reroute triggered at ${new Date().toLocaleTimeString()}`
      });
      
      addNotification(`Route optimized for REF-${dn.externalId}.`, 'success');
      // Force a base load to update map layers immediately
      loadBaseData();
    } catch (err) {
      console.error("Reroute failed", err);
      addNotification(`Reroute attempt failed for REF-${dn.externalId}.`, 'error');
    } finally {
      setIsRerouting(null);
    }
  };

  const activeDns = dns.filter(d => 
    d.status === DNStatus.IN_TRANSIT && 
    d.lastLat && 
    (d.externalId.toLowerCase().includes(search.toLowerCase()) || d.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout title="Control Tower Live">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Main Map View */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
          <MapEngine 
            dns={dns.filter(d => d.status === DNStatus.IN_TRANSIT)} 
            facilities={facilities} 
            focusedDnId={focusedDnId}
            followDriver={followDriver}
            showTraffic={showTraffic}
          />
          
          {/* Dispatch HUD */}
          <div className="absolute top-8 left-8 z-20 flex gap-4 pointer-events-none">
             <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center gap-6 pointer-events-auto">
                <button 
                  onClick={() => setFollowDriver(!followDriver)}
                  className="flex items-center gap-3 group transition-all"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow Pilot</span>
                  {followDriver ? <ToggleRight className="text-brand-accent" size={32} /> : <ToggleLeft className="text-slate-300" size={32} />}
                </button>
                <div className="h-8 w-px bg-slate-100" />
                <button 
                  onClick={() => setShowTraffic(!showTraffic)}
                  className="flex items-center gap-3 group transition-all"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Traffic Layer</span>
                  {showTraffic ? <ToggleRight className="text-emerald-500" size={32} /> : <ToggleLeft className="text-slate-300" size={32} />}
                </button>
                <div className="h-8 w-px bg-slate-100" />
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Uplink: Nominal</span>
                </div>
             </div>
          </div>

          <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-4 pointer-events-auto">
              <div className="flex items-center gap-4 border-r border-slate-100 pr-8">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fleet Coverage</p>
                   <p className="text-xl font-black text-slate-900 leading-none">{activeDns.length} Units</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-blue-50 text-brand-accent rounded-full flex items-center justify-center">
                    <Navigation size={20} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</p>
                    <p className="text-xl font-black text-slate-900 leading-none">Active</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fleet Sidebar */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={14} className="text-brand-accent" /> Live Manifest
                </h3>
                <span className="text-[9px] text-emerald-600 font-black uppercase flex items-center gap-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Tracking
                </span>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Filter by Ref..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-accent outline-none"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
            {loading ? (
               <div className="p-10 space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
               </div>
            ) : activeDns.length === 0 ? (
              <div className="p-12 text-center opacity-30">
                <MapPin className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Empty Live Manifest</p>
              </div>
            ) : (
              activeDns.map(dn => {
                const isLate = dn.lastTelemetryAt && (Date.now() - new Date(dn.lastTelemetryAt).getTime()) > 30000;
                const deviated = dn.isDeviated;
                
                return (
                  <div 
                    key={dn.id} 
                    onClick={() => { setFocusedDnId(dn.id); setFollowDriver(true); }}
                    className={`p-6 hover:bg-slate-50 cursor-pointer group transition-all relative ${focusedDnId === dn.id ? 'bg-blue-50/50 border-l-4 border-l-brand-accent' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-black text-brand-accent uppercase">REF-{dn.externalId}</span>
                      <div className="flex gap-2 items-center">
                        {/* Reroute Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReroute(dn, [dn.lastLat!, dn.lastLng!]);
                          }}
                          disabled={isRerouting === dn.id}
                          className={`p-1.5 rounded-lg transition-all ${deviated ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-brand-accent'}`}
                          title="Recalculate Optimized Route"
                        >
                          <RotateCw className={isRerouting === dn.id ? 'animate-spin' : ''} size={14} />
                        </button>

                        {deviated && <ShieldAlert className="text-red-500 animate-pulse" size={14} />}
                        <Badge variant="transit" className="scale-75 origin-right">Live</Badge>
                      </div>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mb-1 truncate">{dn.clientName}</h4>
                    
                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex flex-col">
                          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${isLate ? 'text-red-400' : 'text-slate-300'}`}>
                             <Clock size={12} /> {isLate ? 'Connection Weak' : 'Sync Nominal'}
                          </div>
                          {dn.routeGeometry && (
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">
                               Est. Progress: {Math.round((findNearestPointIndex([dn.lastLat!, dn.lastLng!], dn.routeGeometry.coordinates) / (dn.routeGeometry.coordinates.length - 1)) * 100)}%
                            </p>
                          )}
                       </div>
                       <ChevronRight className={`text-slate-200 transition-all ${focusedDnId === dn.id ? 'text-brand-accent translate-x-1' : ''}`} size={16} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTracking;
