
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility, LatLngTuple, User } from '../../types';
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
  Map as MapIcon,
  User as UserIcon,
  Info,
  MapPinned,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';

const LiveTracking: React.FC = () => {
  const { tenant } = useTenant();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [focusedDnId, setFocusedDnId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [followDriver, setFollowDriver] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [isRerouting, setIsRerouting] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'MANIFEST' | 'DRIVERS'>('MANIFEST');

  // Debounce for re-routing to avoid spamming engine
  const lastRerouteTime = useRef<Record<string, number>>({});

  useEffect(() => {
    checkPermissions();
    loadBaseData();
    const interval = setInterval(pollTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkPermissions = async () => {
    if ("permissions" in navigator) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" as any });
        setPermissionState(result.state as any);
        result.onchange = () => {
          setPermissionState(result.state as any);
        };
      } catch (err) {
        console.error("Permission check failed", err);
      }
    }
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setPermissionState('granted'),
      () => setPermissionState('denied')
    );
  };

  const loadBaseData = async () => {
    if (!tenant?.id) return;
    const [facs, allDns, allDrivers] = await Promise.all([
      api.getFacilities(tenant.id), 
      api.getDeliveryNotes(tenant.id),
      api.getUsers(tenant.id).then(users => users.filter(u => u.role === 'DRIVER'))
    ]);
    setFacilities(facs);
    setDns(processDnsForUI(allDns));
    setDrivers(allDrivers);
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
        
        // Auto-reroute throttle: 45 seconds to allow driver to correct or for sync to stabilize
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

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(driverSearch.toLowerCase()) || 
    d.email.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const focusedDn = dns.find(d => d.id === focusedDnId);

  if (loading) {
    return (
      <Layout title="Tracking">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-700">
           <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xl">
              <RotateCw className="animate-spin text-brand" size={32} />
           </div>
           <div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-2">Syncing telemetry</h3>
              <p className="text-sm text-gray-400 font-medium">Establishing secure link with regional assets...</p>
           </div>
        </div>
      </Layout>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Layout title="Tracking">
        <div className="flex h-[70vh] flex-col items-center justify-center text-center max-w-md mx-auto animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-red/5 text-red rounded-full flex items-center justify-center mb-8 border border-red/10 shadow-2xl shadow-red/20">
            <MapPinned size={48} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">Location access required</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            The control tower requires geolocation data to calculate optimal routes and monitor driver positioning in real-time.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Enable location
          </button>
        </div>
      </Layout>
    );
  }

  if (dns.filter(d => d.status === DNStatus.IN_TRANSIT).length === 0) {
    return (
      <Layout title="Tracking">
        <div className="flex h-[70vh] flex-col items-center justify-center text-center max-w-md mx-auto animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-brand/5 text-brand rounded-full flex items-center justify-center mb-8 border border-brand/10 shadow-2xl shadow-brand/20">
            <Truck size={48} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">No active shipments to track</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            There are currently no assets in-transit. Dispatch a manifested shipment to initiate real-time telemetry tracking.
          </p>
          <button 
            onClick={() => navigate('/admin/dispatch')}
            className="btn-primary"
          >
            Go to Dispatch
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tracking">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Main Map View */}
        <div className="lg:col-span-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Follow driver</span>
                  {followDriver ? <ToggleRight className="text-brand-accent" size={32} /> : <ToggleLeft className="text-slate-300" size={32} />}
                </button>
                <div className="h-8 w-px bg-slate-100" />
                <button 
                  onClick={() => setShowTraffic(!showTraffic)}
                  className="flex items-center gap-3 group transition-all"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Traffic layer</span>
                  {showTraffic ? <ToggleRight className="text-emerald-500" size={32} /> : <ToggleLeft className="text-slate-300" size={32} />}
                </button>
                <div className="h-8 w-px bg-slate-100" />
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Uplink: Nominal</span>
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
        
        {/* Route Info Panel */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MapPinned size={14} className="text-brand-accent" /> Route Intelligence
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {focusedDn ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest block mb-1">Active shipment</span>
                      <h4 className="text-xl font-bold text-gray-900 tracking-tight">REF-{focusedDn.externalId}</h4>
                    </div>
                    <Badge variant="transit">In transit</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ETA Estimate</p>
                      <p className="text-lg font-black text-brand tracking-tight">14:45 PM</p>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1">On Schedule</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance Left</p>
                      <p className="text-lg font-black text-brand tracking-tight">4.2 KM</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">~12 Mins</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Route Timeline</p>
                  <div className="relative pl-6 space-y-6">
                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100" />
                    
                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <p className="label-logistics text-slate-900 !mb-0">Origin: {focusedDn.originName || 'Central Hub'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Departed at 09:15 AM</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-brand-accent border-2 border-white shadow-sm animate-pulse" />
                      <p className="label-logistics text-slate-900 !mb-0">Current Leg</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate-name">{focusedDn.address}</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                      <p className="label-logistics text-slate-400 !mb-0">Destination</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase truncate-name">{focusedDn.clientName}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                      <TrendingUp size={16} />
                    </div>
                    <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Performance index</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-medium text-slate-500 uppercase">Safety score</span>
                      <span className="text-[9px] font-bold text-emerald-600">98/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[98%]" />
                    </div>
                  </div>
                </div>

                {tenant?.industry === 'E-COMMERCE' && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Last-Mile Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => addNotification(`Delivery marked as completed for ${focusedDn.externalId}`, 'success')}
                         className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                       >
                         <CheckCircle2 size={14} /> Delivered
                       </button>
                       <button 
                         onClick={() => addNotification(`Delivery failed recorded for ${focusedDn.externalId}`, 'error')}
                         className="flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                       >
                         <AlertCircle size={14} /> Failed
                       </button>
                    </div>
                    <button 
                      onClick={() => handleReroute(focusedDn, [focusedDn.lastLat!, focusedDn.lastLng!])}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      <RotateCw size={14} /> Reroute Optimization
                    </button>
                    <button 
                      onClick={() => addNotification(`Tracking link sent to customer for ${focusedDn.externalId}`, 'info')}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <Bell size={14} /> Customer Update
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <Info size={48} className="text-slate-200 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[160px]">Select a unit to view route intelligence</p>
              </div>
            )}
          </div>
        </div>

        {/* Fleet Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
                {(['MANIFEST', 'DRIVERS'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === tab ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
                  >
                    {tab}
                  </button>
                ))}
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder={sidebarTab === 'MANIFEST' ? "Filter by Ref..." : "Search Drivers..."}
                  value={sidebarTab === 'MANIFEST' ? search : driverSearch}
                  onChange={(e) => sidebarTab === 'MANIFEST' ? setSearch(e.target.value) : setDriverSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-accent outline-none"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
            {loading ? (
               <div className="p-10 space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
               </div>
            ) : sidebarTab === 'MANIFEST' ? (
              activeDns.length === 0 ? (
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
                        <span className="mono-id text-brand-accent uppercase">REF-{dn.externalId}</span>
                        <div className="flex gap-2 items-center">
                          {/* Reroute Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReroute(dn, [dn.lastLat!, dn.lastLng!]);
                            }}
                            disabled={isRerouting === dn.id}
                            className={`p-1.5 rounded-lg transition-all ${deviated ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-brand-accent'}`}
                            title="Recalculate Optimized Route"
                          >
                            <RotateCw className={isRerouting === dn.id ? 'animate-spin' : ''} size={14} />
                          </button>

                          {deviated && <ShieldAlert className="text-red-500 animate-pulse" size={14} />}
                          <Badge variant="transit" className="scale-75 origin-right">Live</Badge>
                        </div>
                      </div>
                      <h4 className="body-value mb-1 truncate-name">{dn.clientName}</h4>
                      
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
              )
            ) : (
              filteredDrivers.map(driver => {
                const isActive = dns.some(dn => dn.driverId === driver.id && dn.status === DNStatus.IN_TRANSIT);
                const status = isActive ? 'ON_TRIP' : driver.onDuty ? 'ONLINE' : 'OFFLINE';
                
                return (
                  <div key={driver.id} className="p-6 hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <UserIcon size={20} />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${status === 'ON_TRIP' ? 'bg-blue-500' : status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate">{driver.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'ON_TRIP' ? 'text-blue-600' : status === 'ONLINE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {status.replace('_', ' ')}
                          </span>
                          {status === 'ON_TRIP' && (
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">• TRIP ACTIVE</span>
                          )}
                        </div>
                      </div>
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
