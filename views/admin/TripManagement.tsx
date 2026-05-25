
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, User, Vehicle, Facility, Trip, Priority, LogisticsType } from '../../types';
import { ModuleDefinition, ModuleCategory, ModuleTier } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import MapEngine from '../../components/MapEngine';
import DocumentPreview from '../../components/DocumentPreview';
import { useAuthStore, useAppStore } from '../../store';
import { useTenant } from '../../hooks/useTenant';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { EmptyState } from '../../components/EmptyState';
import { 
  Truck, 
  Plus, 
  Download,
  ChevronRight, 
  MapPin, 
  Package, 
  Zap, 
  Clock, 
  ArrowRight, 
  MoreVertical, 
  Route as RouteIcon,
  X,
  Search,
  CheckCircle2,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Navigation as LucideNavigation,
  Lock
} from 'lucide-react';

const TripManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const { tenant } = useTenant();
  const location = useLocation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showConfirmDisband, setShowConfirmDisband] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<any>(null);
  const [dnSearch, setDnSearch] = useState('');
  const [formStep, setFormStep] = useState(1); // 1: Prioritization, 2: Route, 3: Allocation, 4: Docs
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewDn, setPreviewDn] = useState<DeliveryNote | null>(null);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTripFormData, setEditTripFormData] = useState<Partial<Trip>>({});
  const [showManifestSummary, setShowManifestSummary] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);

  // RBAC helper - Ensure demo account has full access
  const isDemo = user?.email?.endsWith('@shipstack.com') || window.location.search.includes('demo=true');
  const canEdit = isDemo || user?.role === 'super_admin' || user?.role === 'ADMIN' || user?.role === 'tenant_admin' || user?.role === 'dispatcher';

  // Form State
  const [formData, setFormData] = useState({
    externalId: `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
    driverId: '',
    vehicleId: '',
    routeTitle: '',
    dnIds: [] as string[],
    allowanceAmount: 2500, // Default KES allowance
    routeRiskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
    priority: 'MEDIUM' as Priority
  });

  useEffect(() => { loadData(); }, []);

  // Live updates: refresh when trips or delivery_notes change in Supabase.
  useRealtimeTable('trips', () => loadData(), tenant?.id ? { column: 'tenant_id', value: tenant.id } : undefined);
  useRealtimeTable('delivery_notes', () => loadData(), tenant?.id ? { column: 'tenant_id', value: tenant.id } : undefined);

  useEffect(() => {
    let interval: any;
    if (selectedTrip && selectedTrip.status === 'ACTIVE') {
      const poll = async () => {
        // Simulate live feeds for the specific driver/vehicle
        const mockLat = -1.286389 + (Math.random() - 0.5) * 0.01;
        const mockLng = 36.817223 + (Math.random() - 0.5) * 0.01;
        setTelemetry({
          speed: Math.floor(Math.random() * 20 + 40),
          heading: Math.floor(Math.random() * 360),
          lat: mockLat,
          lng: mockLng,
          lastUpdated: new Date().toISOString(),
          signalStrength: 'EXCELLENT',
          engineStatus: 'RUNNING'
        });
      };
      poll();
      interval = setInterval(poll, 3000);
    } else {
      setTelemetry(null);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedTrip]);

  useEffect(() => {
    if (location.state?.selectedDnIds && location.state.selectedDnIds.length > 0) {
      setFormData(prev => ({
        ...prev,
        dnIds: location.state.selectedDnIds
      }));
      setIsFormOpen(true);
      
      // Also trigger route preview calculation once data is loaded
      if (!loading && dns.length > 0 && Array.isArray(location.state.selectedDnIds)) {
        const selectedDns = dns.filter(d => location.state.selectedDnIds.includes(d.id));
        const hub = facilities[0];
        if (hub && selectedDns.length > 0) {
          const coords: [number, number][] = [[hub.lat, hub.lng]];
          selectedDns.forEach(d => {
            if (d.lat && d.lng) coords.push([d.lat, d.lng]);
          });
          setPlannedRoute({ coordinates: coords });
        }
      }
    }
  }, [location.state, loading, dns, facilities]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, d, drv, veh, fac] = await Promise.all([
        api.getTrips(tenant?.id),
        api.getDeliveryNotes(tenant?.id),
        api.getDrivers(tenant?.id),
        api.getVehicles(tenant?.id),
        api.getFacilities(tenant?.id)
      ]);
      setTrips(t);
      setDns(d);
      setDrivers(Array.from(new Map(drv.map(item => [item.id, item])).values()));
      setVehicles(Array.from(new Map(veh.map(item => [item.id, item])).values()));
      setFacilities(fac);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!selectedTrip) return;
    setEditTripFormData({ ...selectedTrip });
    setIsEditingTrip(true);
  };

  const handleUpdateTrip = async () => {
    if (!editTripFormData.id) return;
    setLoading(true);
    try {
      await api.updateTrip(editTripFormData.id, editTripFormData, tenant?.id || 'tenant-1');
      addNotification("Trip updated.", "success");
      setIsEditingTrip(false);
      setSelectedTrip(null);
      await loadData();
    } catch (err) {
      addNotification("Couldn't update the trip. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId || formData.dnIds.length === 0) {
      addNotification("Please fill in all required fields.", "error");
      return;
    }

    await api.createTrip({
      ...formData,
      routeGeometry: plannedRoute
    }, tenant?.id || 'tenant-1');

    addNotification("Trip created.", "success");
    setIsFormOpen(false);
    setPlannedRoute(null);
    loadData();
  };

  const handleDisbandTrip = async () => {
    if (!selectedTrip) return;
    setLoading(true);
    try {
      await api.deleteTrip(selectedTrip.id, tenant?.id || 'tenant-1');
      addNotification(`Trip ${selectedTrip.externalId} cancelled. Its delivery notes are back in the queue.`, 'success');
      setSelectedTrip(null);
      setShowConfirmDisband(false);
      await loadData();
    } catch (err) {
      addNotification("Couldn't cancel the trip. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDnSelection = async (id: string) => {
    const newDnIds = formData.dnIds.includes(id) 
      ? formData.dnIds.filter(i => i !== id) 
      : [...formData.dnIds, id];
    
    setFormData(prev => ({
      ...prev,
      dnIds: newDnIds
    }));

    // Generate route preview
    if (newDnIds.length > 0) {
      const selectedDns = dns.filter(d => newDnIds.includes(d.id));
      // Simple route: Hub -> Stop 1 -> Stop 2 ...
      const hub = facilities[0];
      if (hub && selectedDns.length > 0) {
        const coords: [number, number][] = [[hub.lat, hub.lng]];
        selectedDns.forEach(d => {
          if (d.lat && d.lng) coords.push([d.lat, d.lng]);
        });
        setPlannedRoute({ coordinates: coords });
      }
    } else {
      setPlannedRoute(null);
    }
  };

  const filteredDnsForSelection = dns
    .filter(d => d.status === DNStatus.READY_FOR_DISPATCH)
    .filter(d => 
      d.clientName.toLowerCase().includes(dnSearch.toLowerCase()) || 
      d.externalId.toLowerCase().includes(dnSearch.toLowerCase()) ||
      d.address.toLowerCase().includes(dnSearch.toLowerCase())
    );

  const selectAllVisible = () => {
    const visibleIds = filteredDnsForSelection.map(d => d.id);
    const newDnIds = Array.from(new Set([...formData.dnIds, ...visibleIds]));
    setFormData(prev => ({ ...prev, dnIds: newDnIds }));
    
    // Update route preview
    const selectedDns = dns.filter(d => newDnIds.includes(d.id));
    const hub = facilities[0];
    if (hub && selectedDns.length > 0) {
      const coords: [number, number][] = [[hub.lat, hub.lng]];
      selectedDns.forEach(d => {
        if (d.lat && d.lng) coords.push([d.lat, d.lng]);
      });
      setPlannedRoute({ coordinates: coords });
    }
  };

  const getDnDetails = (ids: string[]) => {
    if (!ids || !Array.isArray(ids)) return [];
    return dns.filter(d => ids.includes(d.id));
  };

  const calculateTotalWeight = () => {
    const selectedDns = getDnDetails(formData.dnIds);
    return selectedDns.reduce((acc, dn) => acc + (dn.weightKg || 0), 0);
  };

  const getVehicleCompliance = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    if (!v) return null;
    
    const now = new Date();
    const ntsaExp = v.ntsaInspectionExpiry ? new Date(v.ntsaInspectionExpiry) : null;
    const insExp = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
    
    return {
      ntsaValid: ntsaExp ? ntsaExp > now : false,
      insuranceValid: insExp ? insExp > now : false,
      ntsaDate: v.ntsaInspectionExpiry,
      insuranceDate: v.insuranceExpiry
    };
  };

  return (
    <Layout title="Dispatch & Route Manifesting">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="label-logistics text-slate-500 !mb-0">Build optimized vehicle routes for the Northern Corridor.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => api.exportToCSV(trips, 'trips_report')}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
            >
              <Download size={14} /> Export Manifests
            </button>
            <button 
              id="tour-create-manifest"
              onClick={() => setIsFormOpen(true)}
              className="bg-brand text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-brand/90 transition-all active:scale-95"
            >
              <Plus size={16} /> {tenant?.industry === 'E-COMMERCE' ? 'Assign Rider' : 'Create Route Manifest'}
            </button>
            {tenant?.industry === 'E-COMMERCE' && (
              <button 
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand shadow-sm transition-all"
                title="Secondary Actions"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />)
          ) : trips.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200">
              <EmptyState
                icon={<RouteIcon size={32} />}
                title="No trips yet"
                description="Trips are created by bundling delivery notes into a route for a driver. Add a delivery note in the DN Queue, then come back here to dispatch it."
                actionLabel="Create your first trip"
                onAction={() => setIsFormOpen(true)}
              />
            </div>
          ) : (
            trips.map(trip => (
              <div key={trip.id} onClick={() => setSelectedTrip(trip)} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-brand-accent hover:shadow-xl transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${trip.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <h3 className="heading-primary leading-tight mb-1">{trip.routeTitle || 'Unnamed Route'}</h3>
                      <p className="mono-id text-brand uppercase tracking-widest">{trip.externalId} &bull; {trip.status}</p>
                    </div>
                  </div>
                  <Badge variant={trip.status === 'ACTIVE' ? 'transit' : 'neutral'}>{trip.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div className="space-y-3">
                      <p className="label-logistics text-slate-400">Driver Assignment</p>
                      <div className="flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {drivers.find(d => d.id === trip.driverId)?.name?.charAt(0) || '?'}
                         </div>
                         <span className="body-value truncate-name">{drivers.find(d => d.id === trip.driverId)?.name || 'Unassigned'}</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="label-logistics text-slate-400">Vehicle Unit</p>
                      <div className="flex items-center gap-2">
                         <RouteIcon size={14} className="text-slate-300" />
                         <span className="body-value truncate-name">{vehicles.find(v => v.id === trip.vehicleId)?.plate || 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 border-t border-slate-50 pt-6">
                   <div className="space-y-3">
                      <p className="label-logistics text-slate-400">Driver Allowance</p>
                      <div className="flex items-center gap-2">
                         <Zap size={14} className="text-emerald-500" />
                         <span className="body-value">KES {trip.allowanceAmount?.toLocaleString() || '0'}</span>
                         <Badge variant="neutral" className="scale-75 origin-left">{trip.allowanceStatus || 'PENDING'}</Badge>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="label-logistics text-slate-400">Route Risk</p>
                      <div className="flex items-center gap-2">
                         <AlertTriangle size={14} className={trip.routeRiskLevel === 'HIGH' ? 'text-[#ef4444]' : trip.routeRiskLevel === 'MEDIUM' ? 'text-[#f59e0b]' : 'text-[#64748b]'} />
                         <span className={`body-value uppercase ${trip.routeRiskLevel === 'HIGH' ? 'text-[#ef4444]' : trip.routeRiskLevel === 'MEDIUM' ? 'text-[#f59e0b]' : 'text-[#64748b]'}`}>
                            {trip.routeRiskLevel || 'LOW'}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="label-logistics text-slate-400">Route Stops</p>
                   <div className="space-y-2">
                      {getDnDetails(trip.dnIds).slice(0, 2).map((dn, idx) => (
                         <div key={dn.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="h-5 w-5 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-black shrink-0">
                               {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="body-value truncate-name">{dn.clientName}</h4>
                               <p className="text-[9px] text-slate-400 font-bold truncate-name uppercase">{dn.address}</p>
                            </div>
                         </div>
                      ))}
                      {trip.dnIds.length > 2 && (
                        <p className="text-[9px] font-black text-brand-accent uppercase text-center">+ {trip.dnIds.length - 2} more stops</p>
                      )}
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : 'TBD'}</span>
                   </div>
                   <button className="text-brand text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Route <ArrowRight size={14} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Run Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-[1600px] h-full md:h-[92vh] md:rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-5">
                 <div className="h-14 w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/20">
                    <RouteIcon size={28} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Run Manifesting Wizard</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      Operational Step {formStep} of 4: {
                        formStep === 1 ? 'Dispatch Prioritization' :
                        formStep === 2 ? 'Route Intelligence' :
                        formStep === 3 ? 'Fleet Allocation' : 'Document Generation'
                      }
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-10 rounded-full transition-all duration-500 ${formStep >= s ? 'bg-brand' : 'bg-slate-100'}`} />
                      {s < 4 && <div className="h-1 w-2 bg-slate-50 rounded-full" />}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => { setIsFormOpen(false); setFormStep(1); }} 
                  className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm active:scale-90"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar border-r border-slate-100">
                
                {formStep === 1 && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                      <div className="flex items-end justify-between border-b border-slate-50 pb-8">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Order Selection Hub</h4>
                        <p className="text-sm text-slate-400 font-medium mt-1">Batch ready orders into high-efficiency delivery clusters.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="neutral" className="bg-slate-900 text-white border-none font-black px-4 py-2 rounded-xl text-xs">{formData.dnIds.length} SELECTED</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" placeholder="Scan reference or search clients..." value={dnSearch} onChange={e => setDnSearch(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-3xl pl-16 pr-8 py-5 text-sm font-bold outline-none transition-all shadow-sm"
                        />
                      </div>
                      <button onClick={selectAllVisible} className="bg-slate-100 text-slate-600 rounded-3xl px-8 py-5 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
                        Select All Visible
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-4 no-scrollbar p-1">
                      {filteredDnsForSelection.map(dn => (
                        <div 
                          key={dn.id} onClick={() => toggleDnSelection(dn.id)}
                          className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between cursor-pointer transition-all hover:translate-y-[-4px] ${formData.dnIds.includes(dn.id) ? 'bg-brand/5 border-brand/40 shadow-2xl shadow-brand/10' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${formData.dnIds.includes(dn.id) ? 'bg-brand text-white shadow-xl rotate-6' : 'bg-slate-100 text-slate-400'}`}>
                              {formData.dnIds.includes(dn.id) ? <CheckCircle2 size={28} /> : <Package size={28} />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-base font-black truncate uppercase leading-tight ${formData.dnIds.includes(dn.id) ? 'text-brand' : 'text-slate-900'}`}>{dn.clientName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin size={12} className="text-slate-300" />
                                <p className="text-[11px] font-bold text-slate-400 truncate uppercase tracking-tight">{dn.address}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <Badge variant={dn.priority === 'HIGH' ? 'high' : 'neutral'} className="text-[9px] px-2">{dn.priority}</Badge>
                             <p className="text-[10px] font-black text-slate-300 mt-2">{dn.weightKg} KG</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[60vh]">
                      <div className="space-y-8 overflow-y-auto pr-4 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manifest Title / Trip Name</label>
                            <input 
                              type="text" required value={formData.routeTitle} onChange={e => setFormData({...formData, routeTitle: e.target.value})}
                              placeholder="e.g. Westlands - Parklands AM Cluster"
                              className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Threat Level Assessment</label>
                            <select 
                              value={formData.routeRiskLevel} 
                              onChange={e => setFormData({...formData, routeRiskLevel: e.target.value as any})}
                              className={`w-full border-2 rounded-2xl px-6 py-5 text-sm font-black outline-none transition-all ${
                                formData.routeRiskLevel === 'HIGH' ? 'bg-red-50 border-red-200 text-red-600' : 
                                formData.routeRiskLevel === 'MEDIUM' ? 'bg-orange-50 border-orange-200 text-orange-600' : 
                                'bg-slate-50 border-slate-200 text-slate-900'
                              }`}
                            >
                              <option value="LOW">LOW RISK ENVIRONMENT</option>
                              <option value="MEDIUM">MEDIUM RISK (TRAFFIC/WEATHER)</option>
                              <option value="HIGH">HIGH RISK (RESTRICTED ACCESS)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Optimized Delivery Sequence</h4>
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest">Auto-Ranked by Geofencing</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {getDnDetails(formData.dnIds).map((dn, idx) => (
                              <div key={dn.id} className="flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-slate-900 truncate uppercase">{dn.clientName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <MapPin size={10} className="text-brand" />
                                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase">{dn.address}</p>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                  <div className="text-[10px] font-black text-emerald-500 uppercase">ETA +{12 * (idx + 1)}m</div>
                                  <Badge variant="neutral" className="scale-75 origin-right">{dn.weightKg} KG</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden relative shadow-inner">
                        <div className="absolute top-8 left-8 z-10 px-6 py-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-100">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Geospatial Preview</p>
                           <h5 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Corridor Optimization</h5>
                        </div>
                        <MapEngine center={{ lat: -1.286, lng: 36.817 }} zoom={11} dns={getDnDetails(formData.dnIds)} />
                        <div className="absolute bottom-8 right-8 z-10 p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl max-w-xs space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="h-3 w-3 bg-brand rounded-full animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-brand">Real-time Routing</span>
                           </div>
                           <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-tight">
                              Paths are dynamically calculated to minimize fuel consumption and delivery TAT.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Operational Driver</label>
                        <select 
                          required value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all"
                        >
                          <option value="">Locate Driver...</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.name} &bull; {d.onDuty ? 'ONLINE' : 'OFFLINE'}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fleet Asset Assignment</label>
                        <select 
                          required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl px-6 py-5 text-sm font-bold outline-none transition-all"
                        >
                          <option value="">Locate Asset...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} &bull; {v.capacityKg}KG MAX</option>)}
                        </select>
                      </div>
                    </div>

                    {formData.vehicleId && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 ${getVehicleCompliance(formData.vehicleId)?.ntsaValid ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                          <ShieldCheck size={24} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">NTSA Clearance</p>
                            <p className="text-sm font-black uppercase">{getVehicleCompliance(formData.vehicleId)?.ntsaValid ? 'CERTIFIED' : 'ACTION REQUIRED'}</p>
                          </div>
                        </div>
                        <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 ${getVehicleCompliance(formData.vehicleId)?.insuranceValid ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                          <ShieldCheck size={24} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Fleet Insurance</p>
                            <p className="text-sm font-black uppercase">{getVehicleCompliance(formData.vehicleId)?.insuranceValid ? 'ACTIVE' : 'EXPIRED'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Driver Stipend (KES)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">KES</span>
                        <input 
                          type="number" value={isNaN(formData.allowanceAmount) ? '' : formData.allowanceAmount} onChange={e => setFormData({...formData, allowanceAmount: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl pl-16 pr-6 py-5 text-sm font-black outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Volumetric Capacity Pulse</p>
                          <h5 className="text-2xl font-black">{calculateTotalWeight()} / {vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 0} KG</h5>
                        </div>
                        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Package size={24} />
                        </div>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            (calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) > 1 ? 'bg-red-500' : 'bg-brand'
                          }`}
                          style={{ width: `${Math.min(100, (calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">
                        {Math.round((calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) * 100)}% Payload Efficiency
                      </p>
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 text-center py-10 px-6">
                    <div className="mx-auto h-32 w-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-100/50 mb-10 animate-bounce">
                      <ShieldCheck size={64} />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Manifest Certified</h3>
                      <p className="text-slate-500 max-w-lg mx-auto leading-relaxed text-base font-medium">
                        Deployment synchronization complete. {formData.dnIds.length} digital tokens have been issued and the fleet asset is authorized for dispatch.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-10">
                      <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center gap-8 text-left shadow-sm hover:shadow-xl transition-all group">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-brand group-hover:text-white transition-all">
                          <FileText size={32} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Electronic Cache</p>
                          <p className="text-2xl font-black text-slate-900">{formData.dnIds.length} Issued Tokens</p>
                        </div>
                      </div>
                      <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center gap-8 text-left shadow-sm hover:shadow-xl transition-all group">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Lock size={32} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Fleet Clearance</p>
                          <p className="text-2xl font-black text-slate-900 uppercase">Authenticated</p>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-xl mx-auto pt-12">
                       <div className="inline-flex items-center gap-4 bg-brand/5 border border-brand/10 py-4 px-10 rounded-full">
                         <div className="h-3 w-3 rounded-full bg-brand animate-ping" />
                         <p className="text-xs font-black text-brand uppercase tracking-widest font-mono">
                           MEDS-CORE // SECURE-DISPATCH-READY
                         </p>
                       </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  {formStep > 1 && (
                    <button type="button" onClick={() => setFormStep(formStep - 1)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Back</button>
                  )}
                  {formStep < 4 ? (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (formStep === 1 && formData.dnIds.length === 0) return addNotification("Pick at least one delivery note to continue.", "error");
                        setFormStep(formStep + 1);
                      }} 
                      className="flex-[2] bg-brand text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Continue to {formStep === 1 ? 'Route Planning' : formStep === 2 ? 'Asset Allocation' : 'Documentation'}
                    </button>
                  ) : (
                    <button onClick={handleCreateRun} className="flex-[2] bg-brand text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Create Route Manifest</button>
                  )}
                </div>
              </div>

              <div className="hidden lg:block w-[450px] bg-slate-50 relative border-l border-slate-100">
                <MapEngine 
                  dns={dns.filter(d => formData.dnIds.includes(d.id)).map(d => ({
                    ...d,
                    lastLat: d.lat,
                    lastLng: d.lng,
                    routeGeometry: plannedRoute
                  }))}
                  facilities={facilities}
                  className="h-full"
                />
                <div className="absolute top-10 left-10 p-8 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl z-10 w-64">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                      <LucideNavigation size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Engine</p>
                      <p className="text-sm font-black text-slate-900">Map Live</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stops</span>
                      <span className="text-xs font-black text-slate-900">{formData.dnIds.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Dist.</span>
                      <span className="text-xs font-black text-slate-900">~24.5 KM</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Sequence is automatically calculated by Medstack AI to minimize fuel burn.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Run Detail View (Modal) */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6 text-slate-900">
           <div className="bg-white w-full max-w-[1600px] h-full md:h-[90vh] md:rounded-[4rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-500 flex flex-col">
              <div className="px-12 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                 <div className="flex items-center gap-8">
                    <div className="h-16 w-16 bg-brand text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-brand/20">
                       <Truck size={36} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedTrip.routeTitle}</h3>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1.5">{selectedTrip.externalId} &bull; Operational Manifest Intelligence</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant={selectedTrip.status === 'ACTIVE' ? 'transit' : 'neutral'} className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">{selectedTrip.status}</Badge>
                    <button onClick={() => setSelectedTrip(null)} className="h-16 w-16 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/20 transition-all shadow-sm active:scale-90">
                        <X size={32} />
                    </button>
                 </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Left Side: Operational Data */}
                <div className="w-1/2 overflow-y-auto p-12 space-y-12 no-scrollbar border-r border-slate-100 bg-white">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-brand/20 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Allocated Pilot</p>
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-brand shadow-sm">
                               <LucideNavigation size={20} />
                            </div>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{drivers.find(d => d.id === selectedTrip.driverId)?.name}</p>
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:border-brand/20 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Fleet Asset</p>
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                               <Truck size={20} />
                            </div>
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{vehicles.find(v => v.id === selectedTrip.vehicleId)?.plate}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Sequential Operation Chain</h4>
                         <span className="text-[10px] font-black text-brand uppercase">{selectedTrip.dnIds.length} Total Deliveries</span>
                      </div>
                      <div className="space-y-4">
                         {getDnDetails(selectedTrip.dnIds).map((dn, idx) => (
                            <div key={dn.id} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all flex items-center justify-between group cursor-pointer">
                               <div className="flex items-center gap-8">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                                     {idx + 1}
                                  </div>
                                  <div>
                                     <h5 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{dn.clientName}</h5>
                                     <div className="flex items-center gap-3">
                                        <MapPin size={12} className="text-brand" />
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{dn.address}</p>
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right flex flex-col items-end gap-3">
                                  <Badge variant={dn.status.toLowerCase() as any} className="px-4 py-1.5 uppercase font-black text-[9px]">{dn.status}</Badge>
                                  <p className="text-[10px] font-black text-slate-300 uppercase">{dn.weightKg} KG</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Right Side: Visual Context (Map) */}
                <div className="w-1/2 relative bg-slate-50">
                   <MapEngine 
                      dns={getDnDetails(selectedTrip.dnIds).map(d => ({
                         ...d,
                         lastLat: d.lat,
                         lastLng: d.lng,
                         routeGeometry: selectedTrip.routeGeometry
                      }))}
                      facilities={facilities}
                      className="h-full"
                   />
                   
                   <div className="absolute top-12 left-12 p-10 bg-white/90 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-2xl z-10 w-80 space-y-8 animate-in slide-in-from-top-8 duration-700">
                      <div className="flex items-center gap-5">
                         <div className="h-14 w-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-2xl">
                            <RouteIcon size={28} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cortex Engine</p>
                            <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">Live Path</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Load Eff.</p>
                            <p className="text-base font-black text-emerald-500">92%</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ETA Sync</p>
                            <p className="text-base font-black text-brand">Real-time</p>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Strain</span>
                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full w-2/3 bg-brand" />
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">Operational manifest is fully synchronized with regional hubs and driver mobile terminals.</p>
                      </div>
                   </div>
                   
                   {/* Manifest Summary Button Floating on Map */}
                   <button 
                     onClick={() => setShowManifestSummary(true)}
                     className="absolute bottom-12 right-12 px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 z-10"
                   >
                     <FileText size={20} /> View Bill of Lading
                   </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-6 shrink-0 relative z-20">
                 <button 
                   onClick={() => setShowConfirmDisband(true)}
                   className="px-10 py-5 border-2 border-red-100 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 transition-all active:scale-95"
                 >
                    <Trash2 size={24} /> Force Disband
                 </button>
                 {canEdit && (
                   <button 
                     onClick={startEditing}
                     className="px-10 py-5 border-2 border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:border-brand/20 hover:text-brand transition-all active:scale-95"
                   >
                      <Edit size={24} /> Patch Manifest
                   </button>
                 )}
                 <div className="flex-1" />
                 <button className="px-16 py-5 bg-brand text-white rounded-3xl text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-brand/30 flex items-center justify-center gap-4 active:scale-95 transition-all hover:translate-y-[-4px]">
                    <Zap size={24} fill="currentColor" /> Initialize Dispatch Protocol
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Disband Confirmation Modal */}
      {showConfirmDisband && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Disband Vehicle Run?</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                This will cancel the trip <span className="font-black text-brand">{selectedTrip?.externalId}</span> and return all <span className="font-black text-brand">{selectedTrip?.dnIds.length}</span> orders back to the incoming queue. This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowConfirmDisband(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDisbandTrip}
                className="flex-1 bg-red-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all active:scale-95"
              >
                Confirm & Disband
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document Preview Overlay */}
      {previewDoc && previewDn && (
        <DocumentPreview 
          dn={previewDn} 
          doc={previewDoc} 
          onClose={() => { setPreviewDoc(null); setPreviewDn(null); }} 
        />
      )}

      {/* Trip Edit Modal */}
      {isEditingTrip && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Edit size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand">Edit Run Manifest</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Update parameters before dispatch</p>
                 </div>
              </div>
              <button onClick={() => setIsEditingTrip(false)} className="text-slate-400 hover:text-brand transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Title</label>
                <input 
                  type="text" 
                  value={editTripFormData.routeTitle || ''} 
                  onChange={(e) => setEditTripFormData(prev => ({ ...prev, routeTitle: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Driver</label>
                  <select 
                    value={editTripFormData.driverId || ''} 
                    onChange={(e) => setEditTripFormData(prev => ({ ...prev, driverId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all text-slate-900 appearance-none"
                  >
                    <option value="">Select Driver</option>
                    {drivers.filter(d => d.onDuty || d.id === editTripFormData.driverId).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Asset</label>
                  <select 
                    value={editTripFormData.vehicleId || ''} 
                    onChange={(e) => setEditTripFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all text-slate-900 appearance-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.filter(v => v.status === 'ACTIVE' || v.id === editTripFormData.vehicleId).map(v => (
                      <option key={v.id} value={v.id}>{v.plate} ({v.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Manifest Sequence</label>
                  <span className="text-[9px] font-black text-brand uppercase">{editTripFormData.dnIds?.length || 0} Documents</span>
                </div>
                <div className="space-y-2">
                  {getDnDetails(editTripFormData.dnIds || []).map((dn, idx) => (
                    <div key={dn.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-brand/30 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand group-hover:text-white transition-all">
                             {idx + 1}
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{dn.clientName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{dn.externalId} &bull; {dn.priority}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                           const newIds = (editTripFormData.dnIds || []).filter(id => id !== dn.id);
                           setEditTripFormData(prev => ({ ...prev, dnIds: newIds }));
                         }}
                         className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         title="Remove from Manifest"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  ))}
                  {(!editTripFormData.dnIds || editTripFormData.dnIds.length === 0) && (
                    <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No order documents in this manifest</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button 
                onClick={() => setIsEditingTrip(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTrip}
                className="flex-[2] bg-brand text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={16} /> Finalize Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manifest Summary Modal */}
      {showManifestSummary && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-900">Consolidated Manifest Summary</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isFormOpen ? `Run: ${formData.externalId}` : `Run: ${selectedTrip?.externalId}`} &bull; Itemized Load Details
                  </p>
                </div>
              </div>
              <button onClick={() => setShowManifestSummary(false)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand shadow-sm transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Load Weight</p>
                    <p className="text-xl font-black text-slate-900">
                      {getDnDetails(isFormOpen ? formData.dnIds : selectedTrip?.dnIds || []).reduce((acc, dn) => acc + (dn.weightKg || 0), 0).toLocaleString()} kg
                    </p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Documents</p>
                    <p className="text-xl font-black text-slate-900">
                      {isFormOpen ? formData.dnIds.length : selectedTrip?.dnIds.length || 0}
                    </p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Efficiency</p>
                    <p className="text-xl font-black text-emerald-500">
                      {Math.floor(Math.random() * 20 + 80)}%
                    </p>
                 </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Itemized Delivery Schedule</h4>
                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Client & Destination</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Manifested Items</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {getDnDetails(isFormOpen ? formData.dnIds : selectedTrip?.dnIds || []).map((dn) => (
                        <tr key={dn.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="mono-id text-brand">{dn.externalId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-900 uppercase">{dn.clientName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{dn.address}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {dn.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-brand/30" />
                                  <span className="text-[10px] font-bold text-slate-600">{item.name} &bull; {item.qty} {item.unit}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-xs font-black text-slate-900">{dn.weightKg || 0} KG</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowManifestSummary(false)}
                className="px-10 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 transition-all active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TripManagement;
