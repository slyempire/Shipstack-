
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, User, Vehicle, Facility, Trip, Priority } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import MapEngine from '../../components/MapEngine';
import DocumentPreview from '../../components/DocumentPreview';
import { useAuthStore, useAppStore } from '../../store';
import { useTenant } from '../../hooks/useTenant';
import { 
  Truck, 
  Plus, 
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
  ShieldCheck
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
    const [t, d, drv, veh, fac] = await Promise.all([
      api.getTrips(),
      api.getDeliveryNotes(),
      api.getDrivers(),
      api.getVehicles(),
      api.getFacilities()
    ]);
    setTrips(t);
    setDns(d);
    setDrivers(Array.from(new Map(drv.map(item => [item.id, item])).values()));
    setVehicles(Array.from(new Map(veh.map(item => [item.id, item])).values()));
    setFacilities(fac);
    setLoading(false);
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId || formData.dnIds.length === 0) {
      addNotification("Complete all required fields", "error");
      return;
    }
    
    await api.createTrip({
      ...formData,
      routeGeometry: plannedRoute
    });
    
    addNotification("New run manifested successfully", "success");
    setIsFormOpen(false);
    setPlannedRoute(null);
    loadData();
  };

  const handleDisbandTrip = async () => {
    if (!selectedTrip) return;
    setLoading(true);
    try {
      await api.deleteTrip(selectedTrip.id);
      addNotification(`Trip ${selectedTrip.externalId} disbanded. Orders returned to queue.`, 'success');
      setSelectedTrip(null);
      setShowConfirmDisband(false);
      await loadData();
    } catch (err) {
      addNotification('Failed to disband trip.', 'error');
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
            <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
              <RouteIcon className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active vehicle runs found</p>
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
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center shadow-lg">
                    <RouteIcon size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand">Manifesting Wizard</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Step {formStep} of 4: {
                      formStep === 1 ? 'Prioritization & Selection' :
                      formStep === 2 ? 'Route Optimization' :
                      formStep === 3 ? 'Driver & Asset Allocation' : 'Documentation Preparation'
                    }</p>
                 </div>
              </div>
              <button onClick={() => { setIsFormOpen(false); setFormStep(1); }} className="text-slate-400 hover:text-brand"><X size={24} /></button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar border-r border-slate-100">
                
                {formStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Step 3: Delivery Prioritization</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">Review deadlines, VIP status, and distance clusters. Select orders to batch logically.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consolidate Orders</label>
                        <div className="flex items-center gap-4">
                          <button onClick={selectAllVisible} className="text-[9px] font-black text-brand uppercase hover:underline">Select All Visible</button>
                          <span className="text-[9px] font-black text-brand uppercase">{formData.dnIds.length} Selected</span>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="text" placeholder="Search orders..." value={dnSearch} onChange={e => setDnSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-5 py-3 text-xs font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                        {filteredDnsForSelection.map(dn => (
                          <div 
                            key={dn.id} onClick={() => toggleDnSelection(dn.id)}
                            className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${formData.dnIds.includes(dn.id) ? 'bg-brand text-white border-brand shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${formData.dnIds.includes(dn.id) ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                {formData.dnIds.includes(dn.id) ? <CheckCircle2 size={14} /> : <Package size={14} className="text-slate-300" />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-black truncate ${formData.dnIds.includes(dn.id) ? 'text-white' : 'text-slate-900'}`}>{dn.clientName}</p>
                                <p className={`text-[9px] font-bold truncate ${formData.dnIds.includes(dn.id) ? 'text-white/60' : 'text-slate-400'}`}>{dn.externalId} &bull; {dn.address}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Step 4: Route Planning & Optimization</p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">Grouping deliveries geographically and optimizing sequence for fuel efficiency.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Title</label>
                        <input 
                          type="text" required value={formData.routeTitle} onChange={e => setFormData({...formData, routeTitle: e.target.value})}
                          placeholder="e.g. Nairobi Central Loop"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Route Risk Assessment</label>
                        <select 
                          value={formData.routeRiskLevel} 
                          onChange={e => setFormData({...formData, routeRiskLevel: e.target.value as any})}
                          className={`w-full border-2 rounded-xl px-5 py-4 text-sm font-bold outline-none transition-all ${
                            formData.routeRiskLevel === 'HIGH' ? 'bg-red-50 border-red-200 text-red-600' : 
                            formData.routeRiskLevel === 'MEDIUM' ? 'bg-orange-50 border-orange-200 text-orange-600' : 
                            'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        >
                          <option value="LOW">LOW RISK (Standard)</option>
                          <option value="MEDIUM">MEDIUM RISK (Congestion/Weather)</option>
                          <option value="HIGH">HIGH RISK (Security Alert)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Optimized Sequence</p>
                      <div className="space-y-2">
                        {getDnDetails(formData.dnIds).map((dn, idx) => (
                          <div key={dn.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="h-6 w-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{dn.clientName}</p>
                              <p className="text-[9px] font-bold text-slate-400 truncate uppercase">{dn.address}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-black text-emerald-500 uppercase">ETA: +{15 * (idx + 1)}m</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">{dn.weightKg} KG</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Step 5: Vehicle & Driver Allocation</p>
                      <p className="text-[11px] text-purple-800 leading-relaxed">Matching load to vehicle capacity and ensuring driver compliance.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Driver</label>
                        <select 
                          required value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                        >
                          <option value="">Select Driver...</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.onDuty ? 'On Duty' : 'Off Duty'})</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle Unit</label>
                        <select 
                          required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                        >
                          <option value="">Select Vehicle...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} ({v.type} - {v.capacityKg}kg)</option>)}
                        </select>
                      </div>
                    </div>

                    {formData.vehicleId && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${getVehicleCompliance(formData.vehicleId)?.ntsaValid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                          <ShieldCheck size={16} />
                          <div>
                            <p className="text-[9px] font-black uppercase">NTSA Inspection</p>
                            <p className="text-[10px] font-bold">{getVehicleCompliance(formData.vehicleId)?.ntsaValid ? 'VALID' : 'EXPIRED'}</p>
                          </div>
                        </div>
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${getVehicleCompliance(formData.vehicleId)?.insuranceValid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                          <ShieldCheck size={16} />
                          <div>
                            <p className="text-[9px] font-black uppercase">Insurance Policy</p>
                            <p className="text-[10px] font-bold">{getVehicleCompliance(formData.vehicleId)?.insuranceValid ? 'VALID' : 'EXPIRED'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Driver Allowance (KES)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">KES</span>
                        <input 
                          type="number" value={isNaN(formData.allowanceAmount) ? '' : formData.allowanceAmount} onChange={e => setFormData({...formData, allowanceAmount: parseInt(e.target.value) || 0})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacity Check</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {calculateTotalWeight()} / {vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 0} KG
                        </p>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) > 1 ? 'bg-red-500' : 'bg-brand'
                          }`}
                          style={{ width: `${Math.min(100, (calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) * 100)}%` }} 
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {Math.round((calculateTotalWeight() / (vehicles.find(v => v.id === formData.vehicleId)?.capacityKg || 1)) * 100)}% Volumetric Utilization
                      </p>
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Step 6: Documentation Preparation</p>
                      <p className="text-[11px] text-orange-800 leading-relaxed">Preparing digital delivery notes, invoices, and waybills for traceability.</p>
                    </div>
                    
                    <div className="space-y-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Generated Documents</p>
                       <div className="grid grid-cols-1 gap-3">
                          {getDnDetails(formData.dnIds).slice(0, 3).map(dn => (
                             <div key={dn.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-brand transition-all">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand/5 group-hover:text-brand transition-all">
                                      <FileText size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Delivery Note: {dn.externalId}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dn.clientName}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setPreviewDn(dn);
                                    setPreviewDoc({
                                      id: `doc-${dn.id}`,
                                      type: 'DELIVERY_NOTE',
                                      status: 'ISSUED',
                                      issuedAt: new Date().toISOString(),
                                      verificationCode: `MEDS-${dn.externalId}-${Math.floor(1000 + Math.random() * 9000)}`
                                    });
                                  }}
                                  className="p-2 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                                >
                                   <Eye size={16} />
                                </button>
                             </div>
                          ))}
                          {formData.dnIds.length > 3 && (
                             <p className="text-[9px] font-black text-slate-400 uppercase text-center">+ {formData.dnIds.length - 3} more documents generated</p>
                          )}
                       </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fleet Manifest</p>
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-brand transition-all">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand/5 group-hover:text-brand transition-all">
                              <Truck size={18} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Trip Manifest: {formData.externalId}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formData.routeTitle}</p>
                           </div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"><Eye size={16} /></button>
                      </div>
                    </div>

                    <div className="p-6 bg-brand/5 rounded-2xl border border-brand/10">
                      <p className="text-[11px] font-bold text-brand leading-relaxed">By clicking "Manifest Run", you confirm that all documentation has been digitally issued and is traceable within the MEDS platform.</p>
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
                        if (formStep === 1 && formData.dnIds.length === 0) return addNotification("Select at least one order", "error");
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

              <div className="hidden lg:block w-80 bg-slate-50 relative">
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
                <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-lg z-10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Route Preview</p>
                  <p className="text-xs font-bold text-brand">{formData.dnIds.length} stops mapped</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Run Detail View (Modal) */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
                       <Truck size={24} />
                    </div>
                    <div>
                       <h3 className="text-base font-black uppercase tracking-tight text-slate-900">{selectedTrip.routeTitle}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedTrip.externalId} &bull; Operational Review</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedTrip(null)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand shadow-sm transition-all"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Driver assigned</p>
                       <p className="text-sm font-black text-slate-900">{drivers.find(d => d.id === selectedTrip.driverId)?.name}</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Vehicle ID</p>
                       <p className="text-sm font-black text-slate-900">{vehicles.find(v => v.id === selectedTrip.vehicleId)?.plate}</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                       <Badge variant={selectedTrip.status === 'ACTIVE' ? 'transit' : 'neutral'}>{selectedTrip.status}</Badge>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sequence of operations</h4>
                       <div className="space-y-3">
                          {getDnDetails(selectedTrip.dnIds).map((dn, idx) => (
                             <div key={dn.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                   <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-brand group-hover:text-white transition-all">
                                      {idx + 1}
                                   </div>
                                   <div>
                                      <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{dn.clientName}</h5>
                                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                         <MapPin size={10} className="text-brand-accent" /> {dn.address}
                                      </p>
                                   </div>
                                </div>
                                <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-200 h-[400px] relative">
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
                       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-lg z-10">
                          <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Route Visualized</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                 <button 
                   onClick={() => setShowConfirmDisband(true)}
                   className="flex-1 py-4 border border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                 >
                    <Trash2 size={16} /> Disband Run
                 </button>
                 <button className="flex-[2] py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Zap size={16} fill="currentColor" /> Initialize Telemetry
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
    </Layout>
  );
};

export default TripManagement;
