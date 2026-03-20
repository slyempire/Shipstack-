
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Facility, Vehicle, User, LogisticsDocument, DocumentType, DocumentStatus } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAuthStore, useAppStore } from '../../store';
import DocumentPreview from '../../components/DocumentPreview';
import { 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Zap, 
  User as UserIcon, 
  History, 
  RotateCw, 
  ShieldAlert, 
  FileText, 
  Plus, 
  Eye, 
  Printer, 
  ExternalLink,
  Target
} from 'lucide-react';

const TripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  
  const [dn, setDn] = useState<DeliveryNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<LogisticsDocument | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedPickupTime, setPlannedPickupTime] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    const [allDn, facs, drvs, vehs] = await Promise.all([
      api.getDeliveryNotes(), 
      api.getFacilities(), 
      api.getDrivers(), 
      api.getVehicles()
    ]);
    
    const found = allDn.find(d => d.id === id);
    if (found) {
      setDn(found);
      setSelectedFacility(found.facilityId || '');
      setSelectedDriver(found.driverId || '');
      setSelectedVehicle(found.vehicleId || '');
      setPlannedPickupTime(found.plannedPickupTime || '');
      if (found.plannedDeliveryDate) setSelectedDate(found.plannedDeliveryDate);
    }
    setFacilities(facs);
    setDrivers(drvs);
    setVehicles(vehs);
    setLoading(false);
  };

  const handleGenerateDoc = async (type: DocumentType) => {
    if (!dn) return;
    try {
      await api.generateDocument(dn.id, type, user?.name || 'Admin');
      addNotification(`${type.replace('_', ' ')} issued successfully.`, 'success');
      loadAll();
    } catch (err) {
      addNotification('Failed to generate document.', 'error');
    }
  };

  const handleDispatch = async () => {
     if (!selectedFacility || !selectedDriver || !selectedVehicle || !plannedPickupTime) {
        setValidationError("Missing operational allocation data.");
        return;
     }

     setIsDispatching(true);
     try {
       await api.updateDNStatus(dn!.id, DNStatus.DISPATCHED, {
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          facilityId: selectedFacility,
          plannedPickupTime: plannedPickupTime,
          plannedDeliveryDate: selectedDate,
          notes: `Operational allocation authorized by ${user?.name}`
       }, user?.name);
       // Auto-generate Loading Authority upon successful dispatch
       await api.generateDocument(dn!.id, DocumentType.LOADING_AUTHORITY, user?.name || 'System');
       loadAll();
       addNotification("Pilot run manifested. Loading Authority synchronized.", "success");
     } catch (e) {
       setValidationError("Connectivity error during manifest uplink.");
     } finally {
       setIsDispatching(false);
     }
  };

  if (loading || !dn) return <Layout title="Synchronizing..."><div className="p-24 text-center font-black text-slate-300 uppercase tracking-[0.3em]">Querying Operation Archive...</div></Layout>;

  return (
    <Layout title={`Mission Profile: ${dn.externalId}`}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand uppercase tracking-widest transition-all">
          <ChevronLeft size={16} /> Return to Operational Command
        </button>
        <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Mission Core Data */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between gap-10">
               <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Primary Consignee (Target)</p>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-5 uppercase leading-none">{dn.clientName}</h2>
                  <div className="flex items-start gap-3 text-slate-500 max-w-md">
                     <MapPin size={20} className="text-brand-accent shrink-0 mt-0.5" />
                     <p className="text-sm font-bold leading-relaxed uppercase tracking-tight">{dn.address}</p>
                  </div>
               </div>
               <div className="md:text-right border-l md:border-l-0 md:border-r border-slate-100 pr-0 md:pr-12 shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Security Reference</p>
                  <span className="font-mono text-3xl font-black text-brand uppercase tracking-tighter">{dn.externalId}</span>
                  <div className="mt-4 flex md:justify-end gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Pulse</span>
                  </div>
               </div>
            </div>
            <Target size={200} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
          </div>

          {/* Document Governance Vault */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <FileText size={24} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1.5">Document Governance</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance & Legal Archive</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={() => handleGenerateDoc(DocumentType.MANIFEST)}
                    className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-brand-accent transition-all shadow-sm active:scale-95"
                   >
                     <Plus size={16} /> Manifest
                   </button>
                </div>
             </div>

             <div className="divide-y divide-slate-50">
                {dn.documents.length === 0 ? (
                  <div className="p-24 text-center">
                     <FileText className="mx-auto text-slate-100 mb-6" size={64} strokeWidth={1} />
                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Zero documents manifested for this run</p>
                  </div>
                ) : (
                  dn.documents.map(doc => (
                    <div key={doc.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/30 transition-all">
                       <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${doc.status === DocumentStatus.SIGNED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                             <ShieldCheck size={28} />
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-900 tracking-tight uppercase leading-none mb-2">{doc.type.replace('_', ' ')}</p>
                             <div className="flex items-center gap-3">
                                <Badge variant={doc.status === DocumentStatus.ISSUED ? 'dispatched' : 'delivered'} className="scale-90 origin-left">{doc.status}</Badge>
                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-[0.1em]">CODE: {doc.verificationCode}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => setPreviewDoc(doc)}
                            className="p-3 bg-white border border-slate-200 text-brand rounded-xl hover:shadow-lg hover:border-brand-accent transition-all"
                          >
                             <Eye size={20} />
                          </button>
                          <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-brand-accent transition-all">
                             <Printer size={20} />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Operational Allocation Hub */}
          <div className={`bg-white rounded-[2.5rem] border p-12 shadow-sm transition-all ${[DNStatus.RECEIVED, DNStatus.DISPATCHED].includes(dn.status) ? 'border-brand/10' : 'opacity-60 grayscale'}`}>
             <div className="flex items-center justify-between mb-12">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Zap size={18} className="text-brand-accent animate-pulse" /> Operational Allocation Terminal
                </h3>
                {validationError && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">{validationError}</span>}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Loading Hub</label>
                      <select 
                        value={selectedFacility}
                        onChange={(e) => setSelectedFacility(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-inner"
                      >
                          <option value="">Select Target Hub...</option>
                          {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Pilot (Operator)</label>
                      <select 
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-inner"
                      >
                          <option value="">Select Pilot...</option>
                          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Fleet Asset Assignment</label>
                      <select 
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-inner"
                      >
                          <option value="">Select Vehicle Unit...</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} &bull; {v.type}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Launch Schedule</label>
                      <div className="flex gap-4">
                         <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold shadow-inner" />
                         <input type="time" value={plannedPickupTime} onChange={(e) => setPlannedPickupTime(e.target.value)} className="w-36 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold shadow-inner" />
                      </div>
                   </div>
                </div>
             </div>
             
             {[DNStatus.RECEIVED, DNStatus.DISPATCHED].includes(dn.status) && (
               <div className="mt-16 flex items-center justify-end">
                  <button 
                    onClick={handleDispatch}
                    disabled={isDispatching}
                    className="bg-brand text-white px-12 py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 disabled:opacity-30 transition-all flex items-center gap-5"
                  >
                    {isDispatching ? <RotateCw className="animate-spin" size={24} /> : <Truck size={24} />}
                    Finalize Allocation & Manifest Run
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Audit Sidebar Control */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <History size={160} className="absolute -right-8 -bottom-8 opacity-5" />
              <div className="relative z-10">
                 <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                   <History size={20} className="text-brand-accent" /> Operation Audit
                 </h3>
                 <div className="space-y-8 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
                    {dn.logs.length === 0 ? (
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center py-10">No logs manifested</p>
                    ) : (
                      dn.logs.map((log, idx) => (
                        <div key={log.id} className="relative pl-8 border-l border-white/10 pb-8 last:pb-0">
                           <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-brand-accent shadow-[0_0_10px_rgba(31,106,225,0.6)]" />
                           <p className="text-[11px] font-black uppercase tracking-tight mb-2 leading-none">{log.action}</p>
                           <p className="text-[10px] text-white/40 font-bold mb-4 leading-relaxed uppercase tracking-tight">{log.notes}</p>
                           <div className="flex items-center justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                              <span>{log.user}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
           
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Compliance Status</h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-900">Uplink Encryption Verified</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Target size={18} className="text-brand-accent" />
                    <span className="text-[10px] font-black uppercase text-slate-900">Geo-fenced Handover Enabled</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {previewDoc && <DocumentPreview dn={dn} doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </Layout>
  );
};

export default TripDetail;