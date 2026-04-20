
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DeliveryItem, DNStatus, Facility, Vehicle, User, LogisticsDocument, LogisticsDocumentType, LogisticsDocumentStatus } from '../../types';
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
  Target,
  Package,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Save,
  X
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

  // Item Management State
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editingItems, setEditingItems] = useState<DeliveryItem[]>([]);
  
  // Exception State
  const [isReportingException, setIsReportingException] = useState(false);
  const [exceptionType, setExceptionType] = useState<string>('DAMAGED');
  const [exceptionNotes, setExceptionNotes] = useState('');

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
      setEditingItems([...found.items]);
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

  const handleGenerateDoc = async (type: LogisticsDocumentType) => {
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
       await api.generateDocument(dn!.id, LogisticsDocumentType.LOADING_AUTHORITY, user?.name || 'System');
       loadAll();
       addNotification("Driver run manifested. Loading Authority synchronized.", "success");
     } catch (e) {
       setValidationError("Connectivity error during manifest uplink.");
     } finally {
       setIsDispatching(false);
     }
  };

  const handleConfirmDelivery = async () => {
    if (!dn) return;
    try {
      await api.updateDNStatus(dn.id, DNStatus.DELIVERED, { notes: 'Delivery confirmed by dispatcher' }, user?.name);
      addNotification('Delivery confirmed successfully.', 'success');
      loadAll();
    } catch (err) {
      addNotification('Failed to confirm delivery.', 'error');
    }
  };

  const handleReportException = async () => {
    if (!dn || !exceptionNotes) return;
    try {
      await api.addDNException(dn.id, exceptionType, exceptionNotes, user?.name || 'Admin');
      await api.updateDNStatus(dn.id, DNStatus.EXCEPTION, { notes: exceptionNotes }, user?.name);
      addNotification('Exception reported successfully.', 'success');
      setIsReportingException(false);
      loadAll();
    } catch (err) {
      addNotification('Failed to report exception.', 'error');
    }
  };

  const handleSaveItems = async () => {
    if (!dn) return;
    try {
      await api.updateDNItems(dn.id, editingItems, user?.name || 'Admin');
      addNotification('Manifest items updated.', 'success');
      setIsEditingItems(false);
      loadAll();
    } catch (err) {
      addNotification('Failed to update items.', 'error');
    }
  };

  const addItem = () => {
    setEditingItems([...editingItems, { id: `item-${Date.now()}`, name: '', qty: 1, unit: 'Units' }]);
  };

  const removeItem = (index: number) => {
    setEditingItems(editingItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: any) => {
    const newItems = [...editingItems];
    if (field === 'dimensions') {
      newItems[index] = { ...newItems[index], dimensions: { ...newItems[index].dimensions, ...value } };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setEditingItems(newItems);
  };

  if (loading || !dn) return <Layout title="Synchronizing..."><div className="p-24 text-center font-black text-slate-300 uppercase tracking-[0.3em]">Querying Operation Archive...</div></Layout>;

  return (
    <Layout title={`Mission Profile: ${dn.externalId}`}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand uppercase tracking-widest transition-all">
          <ChevronLeft size={16} /> Return to Operational Command
        </button>
        <div className="flex items-center gap-4">
          {dn.status !== DNStatus.DELIVERED && dn.status !== DNStatus.COMPLETED && (
            <>
              <button 
                onClick={() => setIsReportingException(true)}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition-all"
              >
                <AlertTriangle size={14} /> Report Exception
              </button>
              <button 
                onClick={handleConfirmDelivery}
                className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all"
              >
                <CheckCircle size={14} /> Confirm Delivery
              </button>
            </>
          )}
          <Badge variant={dn.status.toLowerCase() as any}>{dn.status}</Badge>
        </div>
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

          {/* Items Manifest Hub */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Package size={24} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-none mb-1.5">Items Manifest</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo Inventory & Metrics</p>
                   </div>
                </div>
                {!isEditingItems ? (
                  <button 
                    onClick={() => setIsEditingItems(true)}
                    className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-brand-accent transition-all shadow-sm active:scale-95"
                  >
                    <Edit3 size={16} /> Edit Manifest
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setIsEditingItems(false); setEditingItems([...dn.items]); }}
                      className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button 
                      onClick={handleSaveItems}
                      className="bg-brand text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand/90 transition-all shadow-sm active:scale-95"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                )}
             </div>

             <div className="p-8">
                {isEditingItems ? (
                  <div className="space-y-4">
                    {editingItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-end">
                        <div className="col-span-4 space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                          <input 
                            type="number" 
                            value={item.qty} 
                            onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                          <input 
                            type="text" 
                            value={item.unit} 
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">L</label>
                            <input 
                              type="number" 
                              value={item.dimensions?.length || 0} 
                              onChange={(e) => updateItem(idx, 'dimensions', { length: parseFloat(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">W</label>
                            <input 
                              type="number" 
                              value={item.dimensions?.width || 0} 
                              onChange={(e) => updateItem(idx, 'dimensions', { width: parseFloat(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">H</label>
                            <input 
                              type="number" 
                              value={item.dimensions?.height || 0} 
                              onChange={(e) => updateItem(idx, 'dimensions', { height: parseFloat(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-bold outline-none"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button 
                            onClick={() => removeItem(idx)}
                            className="p-3 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={addItem}
                      className="w-full py-4 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-brand hover:border-brand transition-all"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add New Item</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {dn.items.map((item, idx) => (
                      <div key={idx} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-accent group-hover:text-white transition-all">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {item.qty} {item.unit} {item.dimensions && `• ${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height} ${item.dimensions.unit || 'cm'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
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
                    onClick={() => handleGenerateDoc(LogisticsDocumentType.MANIFEST)}
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
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${doc.status === LogisticsDocumentStatus.VERIFIED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                             <ShieldCheck size={28} />
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-900 tracking-tight uppercase leading-none mb-2">{doc.type.replace('_', ' ')}</p>
                             <div className="flex items-center gap-3">
                                <Badge variant={doc.status === LogisticsDocumentStatus.PENDING ? 'dispatched' : 'delivered'} className="scale-90 origin-left">{doc.status}</Badge>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Driver (Operator)</label>
                      <select 
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all shadow-inner"
                      >
                          <option value="">Select Driver...</option>
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

      {/* Exception Modal */}
      {isReportingException && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Report Exception</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational Disruption Log</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Exception Category</label>
                <select 
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                >
                  <option value="DAMAGED">Cargo Damage</option>
                  <option value="LATE">Schedule Delay</option>
                  <option value="SHORTAGE">Inventory Shortage</option>
                  <option value="REJECTED">Consignee Rejection</option>
                  <option value="OTHER">Other Operational Issue</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Detailed Log Notes</label>
                <textarea 
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  placeholder="Describe the situation in detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all min-h-[120px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsReportingException(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReportException}
                  disabled={!exceptionNotes}
                  className="flex-1 bg-red-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  Log Exception
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TripDetail;