
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Trip, Zone, DeliveryItem } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAuthStore, useAppStore } from '../../store';
import { telemetryService } from '../../services/socket';
import { 
  Search, 
  ArrowRight,
  Truck, 
  CheckCircle, 
  Inbox, 
  Zap, 
  UserPlus, 
  Square, 
  CheckSquare,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus,
  Edit,
  Route,
  Package,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

const DNQueue: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const [dns, setDns] = useState<DeliveryNote[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<DNStatus | 'ALL'>(DNStatus.RECEIVED);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterIndustry, setFilterIndustry] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof DeliveryNote; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDispatch, setShowConfirmDispatch] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDn, setEditingDn] = useState<Partial<DeliveryNote> | null>(null);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, [page, activeTab, search, filterPriority, filterIndustry, filterZone, filterType]);

  useEffect(() => {
    const fetchZones = async () => {
      const z = await api.getZones();
      setZones(z);
    };
    fetchZones();
  }, []);

  useEffect(() => {
    telemetryService.onIngestNew(async (data) => {
      addNotification(`New shipment ingested via API: ${data.externalId}`, 'success');
      // Save the ingested data to local storage so loadData can find it
      await api.processImport([data]);
      loadData();
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (activeTab !== 'ALL') filters.status = activeTab;
      if (filterPriority !== 'ALL') filters.priority = filterPriority;
      if (filterIndustry !== 'ALL') filters.industry = filterIndustry;
      if (filterZone !== 'ALL') filters.zoneId = filterZone;
      if (filterType !== 'ALL') filters.type = filterType;
      if (search) filters.search = search;

      const [pagedData, tripData] = await Promise.all([
        api.getDeliveryNotesPaged(page, limit, filters),
        api.getTrips()
      ]);
      setDns(pagedData.data);
      setTotal(pagedData.total);
      setTrips(tripData);
    } catch (err) {
      addNotification('Failed to load logistics data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof DeliveryNote) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedItems = dns.sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleBatchUpdate = async (nextStatus: DNStatus, message: string) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await api.batchUpdateStatus(selectedIds, nextStatus, {}, user?.name || 'Admin');
      addNotification(message, 'success');
      setSelectedIds([]);
      setShowValidationModal(false);
      setShowFulfillmentModal(false);
      setShowConfirmDispatch(false);
      await loadData();
    } catch (err) {
      addNotification('Failed to update orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = () => {
    if (activeTab === DNStatus.RECEIVED) {
      setShowValidationModal(true);
    } else if (activeTab === DNStatus.VALIDATED) {
      setShowFulfillmentModal(true);
    } else {
      setShowConfirmDispatch(true);
    }
  };

  const handleAddToTrip = async (tripId: string) => {
    await api.addDNsToTrip(tripId, selectedIds);
    addNotification(`Added ${selectedIds.length} orders to trip.`, 'success');
    setSelectedIds([]);
    setShowTripSelector(false);
    loadData();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const tabConfigs = [
    { id: DNStatus.RECEIVED, label: 'Ingested', icon: Inbox },
    { id: DNStatus.VALIDATED, label: 'Verified', icon: CheckSquare },
    { id: DNStatus.READY_FOR_DISPATCH, label: 'Staged', icon: Zap },
    { id: DNStatus.DISPATCHED, label: 'Manifested', icon: UserPlus },
    { id: DNStatus.IN_TRANSIT, label: 'In-Transit', icon: Truck },
    { id: DNStatus.DELIVERED, label: 'Settled', icon: CheckCircle },
  ];

  const SortIndicator = ({ columnKey }: { columnKey: keyof DeliveryNote }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="ml-1 opacity-20 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={10} className="ml-1 text-brand" /> : <ChevronDown size={10} className="ml-1 text-brand" />;
  };

  const handleDateChange = async (id: string, date: string) => {
    try {
      await api.updateDNStatus(id, dns.find(d => d.id === id)?.status || DNStatus.RECEIVED, { plannedDeliveryDate: date }, user?.name || 'Admin');
      addNotification('Due date updated.', 'success');
      loadData();
    } catch (err) {
      addNotification('Failed to update due date.', 'error');
    }
  };

  const handleSaveDn = async () => {
    if (!editingDn?.clientName || !editingDn?.address) {
      addNotification('Client name and address are required.', 'error');
      return;
    }

    try {
      if (editingDn.id) {
        await api.updateDeliveryNote(editingDn.id, editingDn);
        addNotification('Delivery Note updated.', 'success');
      } else {
        await api.createDeliveryNote(editingDn);
        addNotification('Delivery Note created.', 'success');
      }
      setShowEditModal(false);
      setEditingDn(null);
      loadData();
    } catch (err) {
      addNotification('Failed to save Delivery Note.', 'error');
    }
  };

  const handleAddItem = () => {
    const newItem: DeliveryItem = { 
      name: '', 
      qty: 1, 
      unit: 'unit',
      sku: '',
      isHazardous: false,
      dimensions: { length: 0, width: 0, height: 0, unit: 'cm' }
    };
    const items = [...(editingDn?.items || []), newItem];
    setEditingDn({ ...editingDn, items });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const items = [...(editingDn?.items || [])];
    items[index] = { ...items[index], [field]: value };
    setEditingDn({ ...editingDn, items });
  };

  const handleRemoveItem = (index: number) => {
    const items = (editingDn?.items || []).filter((_, i) => i !== index);
    setEditingDn({ ...editingDn, items });
  };

  return (
    <Layout title="Operations Manifest">
      <div className="flex flex-col gap-5 h-full">
        {/* Status Bar: High Density */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex p-0.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
            {tabConfigs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-brand'}`}
              >
                <tab.icon size={11} strokeWidth={3} />
                {tab.label}
                <span className={`ml-1 px-1.5 rounded-full text-[8px] ${activeTab === tab.id ? 'bg-brand/5 text-brand' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                  {dns.filter(d => d.status === tab.id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                setEditingDn({ items: [{ name: '', qty: 1, unit: 'unit' }] });
                setShowEditModal(true);
              }}
              className="bg-brand text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-brand/90 transition-all shrink-0"
            >
              <Plus size={14} /> Issue Note
            </button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
              <input 
                type="text" placeholder="Filter Manifest Items..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
              />
            </div>
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            <select 
              value={filterIndustry} 
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
            >
              <option value="ALL">All Industries</option>
              <option value="MEDICAL">Medical</option>
              <option value="FOOD">Food</option>
              <option value="MANUFACTURING">Manufacturing</option>
            </select>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
            >
              <option value="ALL">All Types</option>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
            </select>
            <select 
              value={filterZone} 
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
            >
              <option value="ALL">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Command Overlay: Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} Selected Items</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex gap-2 relative">
              <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-white/40 hover:text-white uppercase px-2">Cancel</button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowTripSelector(!showTripSelector)}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Route size={12} /> Add to Trip
                </button>
                
                {showTripSelector && (
                  <div className="absolute bottom-full mb-4 left-0 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 origin-bottom">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Target Run</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                      {trips.filter(t => t.status === 'PENDING').map(trip => (
                        <button 
                          key={trip.id}
                          onClick={() => handleAddToTrip(trip.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                        >
                          <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-accent truncate">{trip.routeTitle || trip.externalId}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{trip.externalId}</p>
                        </button>
                      ))}
                      <button 
                        onClick={() => navigate('/admin/dispatch', { state: { selectedDnIds: selectedIds } })}
                        className="w-full text-left p-3 rounded-lg hover:bg-brand/5 dark:hover:bg-brand/10 transition-all flex items-center gap-2 text-brand dark:text-brand-accent"
                      >
                        <Plus size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Create New Run</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => navigate('/admin/dispatch', { state: { selectedDnIds: selectedIds } })} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <Plus size={12} /> Create Run
              </button>

              <button onClick={handleActionClick} className="bg-brand-accent text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600">
                <Zap size={12} fill="currentColor" /> 
                {activeTab === DNStatus.RECEIVED ? 'Validate Orders' : activeTab === DNStatus.VALIDATED ? 'Mark Ready for Dispatch' : 'Dispatch Manifest'}
              </button>
            </div>
          </div>
        )}

        {/* Edit/Create Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                    {editingDn?.id ? 'Edit Delivery Note' : 'Create Delivery Note'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Logistics Entry</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                  <AlertCircle size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                    <select 
                      value={editingDn?.priority || 'MEDIUM'} 
                      onChange={(e) => setEditingDn({ ...editingDn, priority: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="LOW">LOW PRIORITY</option>
                      <option value="MEDIUM">MEDIUM PRIORITY</option>
                      <option value="HIGH">HIGH PRIORITY</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logistics Type</label>
                    <select 
                      value={editingDn?.type || 'OUTBOUND'} 
                      onChange={(e) => setEditingDn({ ...editingDn, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="INBOUND">INBOUND (SUPPLIER → HUB)</option>
                      <option value="OUTBOUND">OUTBOUND (HUB → CUSTOMER)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Industry Workflow</label>
                    <select 
                      value={editingDn?.industry || 'GENERAL'} 
                      onChange={(e) => setEditingDn({ ...editingDn, industry: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="GENERAL">GENERAL LOGISTICS</option>
                      <option value="MEDICAL">MEDICAL (COLD CHAIN)</option>
                      <option value="FOOD">FOOD & PERISHABLES</option>
                      <option value="MANUFACTURING">MANUFACTURING</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {editingDn?.type === 'INBOUND' ? 'Supplier Name' : 'Reference ID (External)'}
                    </label>
                    <input 
                      type="text" 
                      value={editingDn?.externalId || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, externalId: e.target.value })}
                      placeholder={editingDn?.type === 'INBOUND' ? 'e.g. Global Pharma Supplies' : 'e.g. INV-2024-001'}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {editingDn?.type === 'INBOUND' ? 'Destination Hub' : 'Client / Consignee Name'}
                    </label>
                    <input 
                      type="text" 
                      value={editingDn?.clientName || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, clientName: e.target.value })}
                      placeholder={editingDn?.type === 'INBOUND' ? 'e.g. MEDS Central Hub' : 'e.g. Nairobi General Hospital'}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20"
                    />
                  </div>
                </div>

                {editingDn?.type === 'INBOUND' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Address</label>
                      <input 
                        type="text" 
                        value={editingDn?.originAddress || ''} 
                        onChange={(e) => setEditingDn({ ...editingDn, originAddress: e.target.value })}
                        placeholder="e.g. Industrial Area, Nairobi"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Address</label>
                      <input 
                        type="text" 
                        value={editingDn?.address || ''} 
                        onChange={(e) => setEditingDn({ ...editingDn, address: e.target.value })}
                        placeholder="e.g. Mombasa Road, Nairobi"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20"
                      />
                    </div>
                  </div>
                )}

                {editingDn?.type !== 'INBOUND' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Address</label>
                      <input 
                        type="text" 
                        value={editingDn?.address || ''} 
                        onChange={(e) => setEditingDn({ ...editingDn, address: e.target.value })}
                        placeholder="e.g. Plot 45, Industrial Area, Nairobi"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-brand/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Zone</label>
                      <select 
                        value={editingDn?.zoneId || ''} 
                        onChange={(e) => setEditingDn({ ...editingDn, zoneId: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                      >
                        <option value="">No Zone Assigned</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Manifest Items</label>
                    <button onClick={handleAddItem} className="text-[9px] font-black text-brand dark:text-brand-accent uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <Plus size={10} /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingDn?.items?.map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            placeholder="Item Name"
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                          <input 
                            type="text" 
                            value={item.sku || ''} 
                            onChange={(e) => handleUpdateItem(idx, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="w-32 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                          <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-300 hover:text-red-500">
                            <AlertCircle size={14} />
                          </button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            value={isNaN(item.qty) ? '' : item.qty} 
                            onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                            className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                          <input 
                            type="text" 
                            value={item.unit} 
                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                          <div className="flex-1 flex gap-1 items-center">
                            <input 
                              type="number" 
                              value={isNaN(item.dimensions?.length) ? '' : item.dimensions?.length} 
                              onChange={(e) => handleUpdateItem(idx, 'dimensions', { ...item.dimensions, length: parseFloat(e.target.value) || 0 })}
                              placeholder="L"
                              className="w-12 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                            />
                            <input 
                              type="number" 
                              value={isNaN(item.dimensions?.width) ? '' : item.dimensions?.width} 
                              onChange={(e) => handleUpdateItem(idx, 'dimensions', { ...item.dimensions, width: parseFloat(e.target.value) || 0 })}
                              placeholder="W"
                              className="w-12 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                            />
                            <input 
                              type="number" 
                              value={isNaN(item.dimensions?.height) ? '' : item.dimensions?.height} 
                              onChange={(e) => handleUpdateItem(idx, 'dimensions', { ...item.dimensions, height: parseFloat(e.target.value) || 0 })}
                              placeholder="H"
                              className="w-12 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                            />
                            <select 
                              value={item.dimensions?.unit || 'cm'}
                              onChange={(e) => handleUpdateItem(idx, 'dimensions', { ...item.dimensions, unit: e.target.value })}
                              className="px-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                            >
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                              <option value="in">in</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <input 
                              type="checkbox" 
                              checked={item.isHazardous || false} 
                              onChange={(e) => handleUpdateItem(idx, 'isHazardous', e.target.checked)}
                              className="h-3 w-3 text-brand"
                            />
                            <span className="text-[9px] font-black uppercase text-slate-400">Hazmat</span>
                          </div>
                        </div>
                        {item.isHazardous && (
                          <input 
                            type="text" 
                            value={item.hazardClass || ''} 
                            onChange={(e) => handleUpdateItem(idx, 'hazardClass', e.target.value)}
                            placeholder="Hazard Class (e.g. Class 3 Flammable)"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                        )}

                        <div className="flex gap-2 items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                          <select 
                            value={item.exceptionType || ''} 
                            onChange={(e) => handleUpdateItem(idx, 'exceptionType', e.target.value || undefined)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          >
                            <option value="">No Exception</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="MISSING">Missing</option>
                            <option value="WRONG_ITEM">Wrong Item</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="OTHER">Other</option>
                          </select>
                          
                          {item.exceptionType && (
                            <select 
                              value={item.exceptionStatus || 'PENDING'} 
                              onChange={(e) => handleUpdateItem(idx, 'exceptionStatus', e.target.value)}
                              className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          )}
                        </div>
                        
                        {item.exceptionType && (
                          <input 
                            type="text" 
                            value={item.exceptionNotes || ''} 
                            onChange={(e) => handleUpdateItem(idx, 'exceptionNotes', e.target.value)}
                            placeholder="Exception details..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Planned Delivery Date</label>
                    <input 
                      type="date" 
                      value={editingDn?.plannedDeliveryDate?.split('T')[0] || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, plannedDeliveryDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Special Notes</label>
                    <input 
                      type="text" 
                      value={editingDn?.notes || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, notes: e.target.value })}
                      placeholder="e.g. Fragile, COD required"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button 
                  onClick={handleSaveDn}
                  className="flex-[2] bg-brand dark:bg-brand-accent text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  {editingDn?.id ? 'Update Delivery Note' : 'Create Delivery Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Modal: Step 1 */}
        {showValidationModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckSquare size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">Order Capture & Validation</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Step 1: Confirm customer details, payment status, and delivery window for <span className="text-brand dark:text-brand-accent font-black">{selectedIds.length}</span> orders.
                </p>
              </div>
              <div className="p-8 space-y-4 max-h-64 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Customer Details Verified</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Payment Status Confirmed</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">SLA Compliance Checked</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setShowValidationModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button 
                  onClick={() => handleBatchUpdate(DNStatus.VALIDATED, `Validated ${selectedIds.length} orders.`)}
                  className="flex-[2] bg-brand text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Confirm & Validate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fulfillment Modal: Step 2 */}
        {showFulfillmentModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
                <div className="h-16 w-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Package size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">Inventory & Fulfillment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Step 2: Warehouse picking, packing, and quality check for <span className="text-brand dark:text-brand-accent font-black">{selectedIds.length}</span> orders.
                </p>
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Stock Availability</span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Confirmed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Packaging Integrity</span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Verified</span>
                </div>
                <div className="pt-4">
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-full animate-pulse" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">Orders marked as "Ready for Dispatch"</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setShowFulfillmentModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button 
                  onClick={() => handleBatchUpdate(DNStatus.READY_FOR_DISPATCH, `Fulfilled ${selectedIds.length} orders. Ready for dispatch.`)}
                  className="flex-[2] bg-amber-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Confirm & Fulfill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal: Generic */}
        {showConfirmDispatch && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">
                  Confirm Dispatch
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  You are about to manifest <span className="text-brand dark:text-brand-accent font-black">{selectedIds.length}</span> orders. This will update their status and notify the assigned logistics units.
                </p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button 
                  onClick={() => setShowConfirmDispatch(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleBatchUpdate(DNStatus.DISPATCHED, `Manifested ${selectedIds.length} orders.`)}
                  className="flex-1 bg-brand-accent text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all active:scale-95"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manifest List: Production Density */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">
                   <button onClick={() => setSelectedIds(selectedIds.length === processedItems.length ? [] : processedItems.map(d => d.id))}>
                    {selectedIds.length === processedItems.length && processedItems.length > 0 ? <CheckSquare className="text-brand-accent mx-auto" size={16} /> : <Square className="text-slate-300 mx-auto" size={16} />}
                  </button>
                </th>
                <th 
                  className="p-3 w-24 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority <SortIndicator columnKey="priority" />
                  </div>
                </th>
                <th 
                  className="p-3 w-32 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  onClick={() => handleSort('externalId')}
                >
                  <div className="flex items-center">
                    Reference <SortIndicator columnKey="externalId" />
                  </div>
                </th>
                <th 
                  className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    Consignee & Address <SortIndicator columnKey="clientName" />
                  </div>
                </th>
                <th className="p-3 w-32 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status <SortIndicator columnKey="status" />
                  </div>
                </th>
                <th className="p-3 w-40 text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="p-3 w-32 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timing</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center animate-pulse text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Syncing Logistics Grid...</td></tr>
              ) : processedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Inbox className="text-slate-200 dark:text-slate-700" size={48} />
                      <p className="text-slate-300 dark:text-slate-600 font-bold uppercase text-[10px]">Queue Clear</p>
                      <button 
                        onClick={() => api.resetData()}
                        className="mt-4 px-6 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand/90 transition-all"
                      >
                        Seed Test Data
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedItems.map(dn => {
                  const isLate = dn.status !== DNStatus.DELIVERED && new Date(dn.createdAt).getTime() < Date.now() - 86400000;
                  return (
                    <tr key={dn.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer ${selectedIds.includes(dn.id) ? 'bg-brand/5 dark:bg-brand/10' : ''}`}>
                      <td className="p-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(dn.id); }}>
                          {selectedIds.includes(dn.id) ? <CheckSquare className="text-brand-accent mx-auto" size={16} /> : <Square className="text-slate-200 dark:text-slate-700 group-hover:text-slate-300 dark:group-hover:text-slate-600 mx-auto" size={16} />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${dn.priority === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : dn.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${dn.priority === 'HIGH' ? 'text-red-600' : dn.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-400 dark:text-slate-500'}`}>
                            {dn.priority}
                          </span>
                        </div>
                        {dn.industry === 'MEDICAL' && (
                          <div className="flex items-center gap-1 mt-1 text-blue-500">
                            <Thermometer size={10} />
                            <span className="text-[8px] font-black uppercase">Cold Chain</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3" onClick={() => navigate(`/admin/trip/${dn.id}`)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-widest ${dn.type === 'INBOUND' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                            {dn.type}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] font-black text-brand dark:text-brand-accent leading-none">DN-{dn.externalId}</p>
                        <Badge variant={dn.status.toLowerCase() as any} className="scale-75 origin-left mt-1.5">{dn.status}</Badge>
                      </td>
                      <td className="p-3" onClick={() => navigate(`/admin/trip/${dn.id}`)}>
                        <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight mb-0.5 truncate">
                          {dn.type === 'INBOUND' ? `${dn.originName || 'Supplier'} → ${dn.clientName}` : dn.clientName}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-tight">
                            {dn.type === 'INBOUND' ? `${dn.originAddress || 'N/A'} → ${dn.address}` : dn.address}
                          </p>
                          {dn.zoneId && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-black uppercase rounded border border-slate-200 dark:border-slate-700">
                              {zones.find(z => z.id === dn.zoneId)?.name || 'Unknown Zone'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                         <div className="flex items-center gap-1.5">
                            <input 
                              type="date" 
                              value={dn.plannedDeliveryDate ? dn.plannedDeliveryDate.split('T')[0] : ''} 
                              onChange={(e) => handleDateChange(dn.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-1 focus:ring-brand/20 transition-all"
                            />
                         </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                           <Clock size={11} /> {new Date(dn.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDn(dn);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-slate-300 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button onClick={() => navigate(`/admin/trip/${dn.id}`)} className="p-2 text-slate-300 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Showing {Math.min(total, (page - 1) * limit + 1)} - {Math.min(total, page * limit)} of {total} Records
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-brand disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-8 w-8 rounded-lg text-[10px] font-black transition-all ${page === i + 1 ? 'bg-brand text-white shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-brand'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-brand disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DNQueue;
