import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { DeliveryNote, DNStatus, Trip, Zone, DeliveryItem } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAuthStore, useAppStore } from '../../store';
import { useTenant } from '../../hooks/useTenant';
import { telemetryService } from '../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
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
  Filter,
  Activity,
  BarChart3,
  Calendar,
  MapPin,
  MoreHorizontal,
  X,
  ShoppingBag
} from 'lucide-react';

const OperationsHub: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useAppStore();
  const { tenant } = useTenant();
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

  const processedItems = [...dns].sort((a, b) => {
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
    { id: DNStatus.RECEIVED, label: 'Ingested', icon: Inbox, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: DNStatus.VALIDATED, label: 'Verified', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: DNStatus.READY_FOR_DISPATCH, label: 'Ready', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: DNStatus.DISPATCHED, label: 'Manifested', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: DNStatus.IN_TRANSIT, label: 'In-Transit', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: DNStatus.DELIVERED, label: 'Settled', icon: CheckCircle, color: 'text-slate-500', bg: 'bg-slate-50' },
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
      id: Math.random().toString(36).substr(2, 9),
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

  const activeTrips = trips.filter(t => t.status === 'ACTIVE');
  const pendingTrips = trips.filter(t => t.status === 'PENDING');

  return (
    <Layout title="Operations Hub">
      <div className="flex flex-col gap-6 h-full">
        {/* Tactical Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tabConfigs.map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ y: -2 }}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border transition-all text-left group ${activeTab === tab.id ? 'bg-white border-brand shadow-lg' : 'bg-white border-slate-200 hover:border-brand/50 shadow-sm'}`}
            >
              <div className={`h-10 w-10 ${tab.bg} ${tab.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <tab.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{tab.label}</p>
              <div className="flex items-end justify-between">
                <p className={`text-2xl font-black ${activeTab === tab.id ? 'text-brand' : 'text-gray-900'}`}>
                  {dns.filter(d => d.status === tab.id).length}
                </p>
                {activeTab === tab.id && <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse mb-2" />}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Main Manifest Section */}
          <div className="lg:col-span-9 flex flex-col gap-4 min-h-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0">
              {/* Header & Filters */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Manifest Queue</h2>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search reference, client..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingDn({ items: [{ id: 'item-1', name: '', qty: 1, unit: 'unit' }] });
                      setShowEditModal(true);
                    }}
                    className="bg-brand text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md hover:bg-brand/90 transition-all"
                  >
                    <Plus size={14} /> New Entry
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-2" />
                  <select 
                    value={filterPriority} 
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                    <tr>
                      <th className="p-4 w-12">
                        <button onClick={() => setSelectedIds(selectedIds.length === processedItems.length ? [] : processedItems.map(d => d.id))}>
                          {selectedIds.length === processedItems.length && processedItems.length > 0 ? <CheckSquare className="text-brand" size={16} /> : <Square className="text-slate-300" size={16} />}
                        </button>
                      </th>
                      <th className="p-4 w-24 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</th>
                      <th className="p-4 w-32 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient & destination</th>
                      <th className="p-4 w-32 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 w-32 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due date</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-20 text-center animate-pulse">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing manifest grid...</p>
                          </div>
                        </td>
                      </tr>
                    ) : processedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Inbox className="text-slate-200" size={48} />
                            <p className="text-slate-400 font-bold uppercase text-[10px]">No items found in this queue</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedItems.map(dn => (
                        <tr 
                          key={dn.id} 
                          className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${selectedIds.includes(dn.id) ? 'bg-brand/5' : ''}`}
                          onClick={() => navigate(`/admin/trip/${dn.id}`)}
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleSelect(dn.id)}>
                              {selectedIds.includes(dn.id) ? <CheckSquare className="text-brand" size={16} /> : <Square className="text-slate-200 group-hover:text-slate-300" size={16} />}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${dn.priority === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : dn.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${dn.priority === 'HIGH' ? 'text-red-500' : dn.priority === 'MEDIUM' ? 'text-amber-500' : 'text-slate-500'}`}>
                                {dn.priority}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-[11px] font-black text-brand uppercase tracking-tight leading-none mb-1">DN-{dn.externalId}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">{dn.type}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-1 truncate max-w-[200px]">{dn.clientName}</p>
                            <div className="flex items-center gap-2">
                              <MapPin size={10} className="text-gray-400" />
                              <p className="text-[10px] text-gray-500 font-bold truncate max-w-[250px] uppercase tracking-tight">{dn.address}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={dn.status.toLowerCase() as any} className="scale-90 origin-left">{dn.status}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-tight">
                              <Calendar size={12} className="text-gray-400" />
                              {dn.plannedDeliveryDate ? new Date(dn.plannedDeliveryDate).toLocaleDateString() : 'Unscheduled'}
                            </div>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                setEditingDn(dn);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-gray-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all"
                            >
                              <Edit size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Showing {dns.length} of {total} items
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-gray-400 hover:text-brand disabled:opacity-30 transition-all font-bold"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      disabled={page >= Math.ceil(total / limit)}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-gray-400 hover:text-brand disabled:opacity-30 transition-all font-bold"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Tactical Context */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Active Trips Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Active runs</h3>
                </div>
                <Badge variant="delivered" className="scale-75">{activeTrips.length}</Badge>
              </div>
              <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
                {activeTrips.length === 0 ? (
                  <div className="p-8 text-center">
                    <Truck className="text-slate-200 mx-auto mb-2" size={32} />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Active Runs</p>
                  </div>
                ) : (
                  activeTrips.map(trip => (
                    <button 
                      key={trip.id}
                      onClick={() => navigate(`/admin/dispatch`)}
                      className="w-full p-4 rounded-xl hover:bg-slate-50 transition-all text-left group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate max-w-[120px]">{trip.routeTitle || trip.externalId}</p>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Package size={10} /> {trip.dnIds?.length || 0} Drops</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button 
                onClick={() => navigate('/admin/dispatch')}
                className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] font-black text-brand uppercase tracking-widest hover:bg-slate-100 transition-all text-center"
              >
                View Dispatch Board
              </button>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-brand text-white rounded-2xl p-6 shadow-xl shadow-brand/20 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Zap size={160} fill="currentColor" />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold tracking-tight text-white mb-2">Dispatch optimizer</h3>
                <p className="text-[10px] font-medium text-white/70 uppercase tracking-widest mb-6 leading-relaxed">
                  Optimize routes and assign drivers in real-time.
                </p>
                <button 
                  onClick={() => navigate('/admin/dispatch')}
                  className="w-full py-3 bg-white text-brand rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Route size={14} /> Launch Dispatcher
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Command Overlay: Floating Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 100, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: 100, x: '-50%', opacity: 0 }}
              className="fixed bottom-10 left-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl flex items-center gap-8 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} Selected Items</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex gap-3">
                <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-white/40 hover:text-white uppercase px-2">Cancel</button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowTripSelector(!showTripSelector)}
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                  >
                    <Route size={14} /> Add to Trip
                  </button>
                  
                  {showTripSelector && (
                    <div className="absolute bottom-full mb-4 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 origin-bottom">
                      <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Target Run</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                        {trips.filter(t => t.status === 'PENDING').map(trip => (
                          <button 
                            key={trip.id}
                            onClick={() => handleAddToTrip(trip.id)}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-all group"
                          >
                            <p className="text-[11px] font-black text-gray-900 uppercase truncate group-hover:text-brand transition-colors">{trip.routeTitle || trip.externalId}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{trip.externalId}</p>
                          </button>
                        ))}
                        <button 
                          onClick={() => navigate('/admin/dispatch', { state: { selectedDnIds: selectedIds } })}
                          className="w-full text-left p-3 rounded-xl hover:bg-brand/5 transition-all flex items-center gap-2 text-brand"
                        >
                          <Plus size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Create New Run</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleActionClick} 
                  className="bg-brand text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand/90 shadow-lg shadow-brand/20 transition-all"
                >
                  <Zap size={14} fill="currentColor" /> 
                  {activeTab === DNStatus.RECEIVED ? 
                    (tenant?.industry === 'E-COMMERCE' ? 'Assign rider' : 'Validate orders') : 
                    activeTab === DNStatus.VALIDATED ? 
                      (tenant?.industry === 'E-COMMERCE' ? 'Dispatch rider' : 'Mark ready') : 
                    activeTab === DNStatus.IN_TRANSIT && tenant?.industry === 'E-COMMERCE' ? 'Mark delivered' :
                    'Dispatch manifest'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        {showEditModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="heading-primary">
                    {editingDn?.id ? 'Edit Delivery Note' : 'Create Delivery Note'}
                  </h3>
                  <p className="label-logistics text-gray-400 mt-1 uppercase tracking-widest">Manual Logistics Entry</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority Level</label>
                    <select 
                      value={editingDn?.priority || 'MEDIUM'} 
                      onChange={(e) => setEditingDn({ ...editingDn, priority: e.target.value as any })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    >
                      <option value="LOW">LOW PRIORITY</option>
                      <option value="MEDIUM">MEDIUM PRIORITY</option>
                      <option value="HIGH">HIGH PRIORITY</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Logistics Type</label>
                    <select 
                      value={editingDn?.type || 'OUTBOUND'} 
                      onChange={(e) => setEditingDn({ ...editingDn, type: e.target.value as any })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    >
                      <option value="INBOUND">INBOUND (SUPPLIER → HUB)</option>
                      <option value="OUTBOUND">OUTBOUND (HUB → CUSTOMER)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference ID</label>
                    <input 
                      type="text" 
                      value={editingDn?.externalId || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, externalId: e.target.value })}
                      placeholder="e.g. INV-2024-001"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
                    <input 
                      type="text" 
                      value={editingDn?.clientName || ''} 
                      onChange={(e) => setEditingDn({ ...editingDn, clientName: e.target.value })}
                      placeholder="e.g. Nairobi General Hospital"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Address</label>
                  <input 
                    type="text" 
                    value={editingDn?.address || ''} 
                    onChange={(e) => setEditingDn({ ...editingDn, address: e.target.value })}
                    placeholder="e.g. Plot 45, Industrial Area, Nairobi"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Manifest Items</label>
                    <button onClick={handleAddItem} className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <Plus size={10} /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingDn?.items?.map((item, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex gap-3 items-center">
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            placeholder="Item Name"
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none"
                          />
                          <input 
                            type="number" 
                            value={item.qty} 
                            onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                            className="w-20 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-tight text-gray-900 outline-none"
                          />
                          <button onClick={() => handleRemoveItem(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                <button 
                  onClick={handleSaveDn}
                  className="flex-[2] bg-brand text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingDn?.id ? 'Update Manifest' : 'Create Manifest'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showValidationModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-10 text-center">
                <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckSquare size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-3">Order Validation</h3>
                <p className="text-sm text-gray-500 font-bold leading-relaxed uppercase tracking-tight">
                  Confirming <span className="text-brand font-black">{selectedIds.length}</span> orders for verification.
                </p>
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setShowValidationModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cancel</button>
                <button 
                  onClick={() => handleBatchUpdate(DNStatus.VALIDATED, `Validated ${selectedIds.length} orders.`)}
                  className="flex-[2] bg-brand text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 transition-all"
                >
                  Confirm & Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OperationsHub;
