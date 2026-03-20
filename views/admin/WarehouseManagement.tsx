
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Layers, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Download,
  Database,
  Upload,
  FileText
} from 'lucide-react';
import { api } from '../../api';
import { InventoryItem, WarehouseMovement, BinLocation } from '../../types';
import Layout from '../../components/Layout';
import { useAppStore } from '../../store';
import Badge from '../../components/Badge';

const WarehouseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'bins'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<WarehouseMovement[]>([]);
  const [bins, setBins] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isRecordMovementOpen, setIsRecordMovementOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const { addNotification } = useAppStore();

  const [newItemData, setNewItemData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'GENERAL',
    qty: 0,
    unit: 'Units',
    minThreshold: 10,
    warehouseId: 'wh-1',
    expiryDate: '',
    tempRequirement: { min: 0, max: 25 }
  });

  const [newMovementData, setNewMovementData] = useState<Partial<WarehouseMovement>>({
    itemId: '',
    type: 'INBOUND',
    qty: 0,
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, movData, binData] = await Promise.all([
        api.getInventory(),
        api.getWarehouseMovements(),
        api.getBinLocations('f-1') // Default to first warehouse
      ]);
      setInventory(invData);
      setMovements(movData);
      setBins(binData);
    } catch (err) {
      console.error('Failed to fetch warehouse data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (importMode) {
        // Frappe-friendly CSV parsing logic
        const lines = bulkData.split('\n');
        if (lines.length < 2) {
          addNotification("CSV must contain at least a header and one data row.", "error");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');

        // Map Frappe fields to our internal structure
        const mappedData = dataRows.map(row => {
          const values = row.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });

        const result = await api.processFrappeStockImport(mappedData);
        
        if (result.failed > 0) {
          addNotification(`Import partial: ${result.success} succeeded, ${result.failed} failed.`, "info");
          console.table(result.errors);
        } else {
          addNotification(`Successfully imported ${result.success} items.`, "success");
        }
        
        setImportMode(false);
        setBulkData('');
        fetchData();
      } else {
        // Check for duplicate SKU
        if (inventory.some(item => item.sku?.toUpperCase() === newItemData.sku?.toUpperCase())) {
          addNotification(`SKU ${newItemData.sku} already exists.`, "error");
          setIsSubmitting(false);
          return;
        }
        await api.addInventoryItem(newItemData as any);
        addNotification("Item added successfully.", "success");
      }
      fetchData();
      setIsAddItemOpen(false);
      setNewItemData({
        sku: '',
        name: '',
        category: '',
        qty: 0,
        unit: 'PCS',
        binLocation: '',
        minThreshold: 10
      });
      setBulkData('');
      setImportMode(false);
    } catch (err) {
      addNotification("Operation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.recordMovement(newMovementData as any);
      setIsRecordMovementOpen(false);
      setNewMovementData({ itemId: '', type: 'INBOUND', qty: 0, fromLocation: '', toLocation: '', notes: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkImport = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    addNotification("Bulk inventory import successful.", "success");
    setIsSubmitting(false);
    setIsAddItemOpen(false);
    setImportMode(false);
    fetchData();
  };

  const [isAddBinOpen, setIsAddBinOpen] = useState(false);
  const [newBinData, setNewBinData] = useState({
    zone: '',
    aisle: '',
    shelf: '',
    bin: '',
    capacity: 100,
    type: 'PICKING' as 'PICKING' | 'BULK' | 'BUFFER' | 'COLD_STORAGE' | 'HAZMAT'
  });

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createBinLocation({
        ...newBinData,
        warehouseId: 'f-1',
        currentFill: 0,
        isOccupied: false
      } as any);
      addNotification("Bin location created successfully.", "success");
      fetchData();
      setIsAddBinOpen(false);
      setNewBinData({ zone: '', aisle: '', shelf: '', bin: '', capacity: 100, type: 'PICKING' });
    } catch (err) {
      addNotification("Failed to create bin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Warehouse Management">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Warehouse Management</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Inventory, Bin Locations & Stock Movements</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'bins' && (
            <button 
              onClick={() => setIsAddBinOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-tight hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={14} />
              Add Bin
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 uppercase tracking-tight hover:bg-slate-50 transition-colors">
            <Download size={14} />
            Export Data
          </button>
          <button 
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-xs font-black text-white uppercase tracking-tight hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total SKU', value: inventory.length, icon: Box, color: 'blue' },
          { label: 'Low Stock Items', value: inventory.filter(i => i.status === 'LOW_STOCK').length, icon: AlertTriangle, color: 'amber' },
          { label: 'Total Movements', value: movements.length, icon: History, color: 'indigo' },
          { label: 'Storage Utilization', value: '68%', icon: Database, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={20} />
              </div>
              <Badge variant="neutral">Live</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'inventory', label: 'Inventory', icon: Box },
          { id: 'movements', label: 'Movements', icon: History },
          { id: 'bins', label: 'Bin Locations', icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'inventory' && (
          <>
            <div className="p-4 border-bottom border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search SKU or Product Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Item</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bin Location</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry / Temp</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white transition-colors">
                            <Box size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</span>
                              {item.batchNumber && (
                                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Batch: {item.batchNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Layers size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{item.binLocation || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-slate-900">{item.qty} {item.unit}</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.qty < item.minThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min((item.qty / (item.minThreshold * 2)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {item.expiryDate ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle size={10} className={new Date(item.expiryDate) < new Date(Date.now() + 86400000 * 7) ? 'text-rose-500' : 'text-slate-400'} />
                              <span className={`text-[10px] font-black uppercase tracking-tight ${new Date(item.expiryDate) < new Date(Date.now() + 86400000 * 7) ? 'text-rose-600' : 'text-slate-600'}`}>
                                Exp: {new Date(item.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Expiry</span>
                          )}
                          {item.tempRequirement && (
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                              Temp: {item.tempRequirement.min}°C to {item.tempRequirement.max}°C
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === 'IN_STOCK' ? 'delivered' : item.status === 'LOW_STOCK' ? 'exception' : 'failed'}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">From/To</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(m.timestamp).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{m.itemId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={m.type === 'INBOUND' ? 'delivered' : m.type === 'OUTBOUND' ? 'failed' : 'neutral'}>
                        {m.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900">
                      {m.type === 'INBOUND' ? '+' : '-'}{m.qty}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-600 uppercase">
                        {m.fromLocation || 'EXT'} → {m.toLocation || 'EXT'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{m.notes}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bins' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <Layers size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            {bin.zone}-{bin.aisle}-{bin.shelf}-{bin.bin}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">WH-1</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="neutral">{bin.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {bin.items && bin.items.length > 0 ? (
                            bin.items.map((item, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-600">{item}</span>
                            ))
                          ) : (
                            <span className="text-[8px] font-bold text-slate-300 italic">EMPTY</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-brand" 
                               style={{ width: `${(bin.currentFill / bin.capacity) * 100}%` }}
                             />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {Math.round((bin.currentFill / bin.capacity) * 100)}%
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant={!bin.isOccupied ? 'delivered' : 'exception'}>
                         {bin.isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                       </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                  {importMode ? 'Bulk Import Stock' : 'Add New Stock Item'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {importMode ? 'Paste CSV data to import multiple items' : 'Register a new SKU in the warehouse system'}
                </p>
              </div>
              <button 
                onClick={() => setImportMode(!importMode)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all flex items-center gap-2"
              >
                {importMode ? <Plus size={14} /> : <Upload size={14} />}
                {importMode ? 'Manual Entry' : 'Bulk Import'}
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-8 space-y-6">
              {importMode ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tight mb-1">Frappe-Friendly Format</p>
                    <p className="text-[9px] font-bold text-indigo-700/60 uppercase tracking-widest leading-relaxed">
                      item_code, item_name, item_group, stock_uom, warehouse, opening_stock
                    </p>
                  </div>
                  <textarea 
                    className="w-full h-64 bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none resize-none transition-all"
                    placeholder="ITEM-001, Surgical Mask, Medical, Nos, wh-1, 1000"
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                  ></textarea>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Part Number</label>
                    <input 
                      type="text" required
                      value={newItemData.sku}
                      onChange={e => setNewItemData({...newItemData, sku: e.target.value?.toUpperCase()})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input 
                      type="text" required
                      value={newItemData.name}
                      onChange={e => setNewItemData({...newItemData, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <input 
                      type="text" required
                      value={newItemData.category}
                      onChange={e => setNewItemData({...newItemData, category: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Qty</label>
                      <input 
                        type="number" required
                        value={isNaN(newItemData.qty as number) ? '' : newItemData.qty}
                        onChange={e => setNewItemData({...newItemData, qty: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                      <select 
                        value={newItemData.unit}
                        onChange={e => setNewItemData({...newItemData, unit: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      >
                        <option value="PCS">Pieces</option>
                        <option value="KGS">Kilograms</option>
                        <option value="LTR">Litres</option>
                        <option value="BOX">Boxes</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bin Location</label>
                    <input 
                      type="text" required
                      value={newItemData.binLocation}
                      onChange={e => setNewItemData({...newItemData, binLocation: e.target.value?.toUpperCase()})}
                      placeholder="e.g. A1-04-B"
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Threshold</label>
                    <input 
                      type="number" required
                      value={isNaN(newItemData.minThreshold as number) ? '' : newItemData.minThreshold}
                      onChange={e => setNewItemData({...newItemData, minThreshold: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Number</label>
                    <input 
                      type="text"
                      value={newItemData.batchNumber}
                      onChange={e => setNewItemData({...newItemData, batchNumber: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="e.g. B-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date (Optional)</label>
                    <input 
                      type="date"
                      value={newItemData.expiryDate}
                      onChange={e => setNewItemData({...newItemData, expiryDate: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp Requirement (°C)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="number"
                        placeholder="Min"
                        value={newItemData.tempRequirement?.min}
                        onChange={e => setNewItemData({...newItemData, tempRequirement: { ...newItemData.tempRequirement!, min: parseInt(e.target.value) || 0 }})}
                        className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      />
                      <input 
                        type="number"
                        placeholder="Max"
                        value={newItemData.tempRequirement?.max}
                        onChange={e => setNewItemData({...newItemData, tempRequirement: { ...newItemData.tempRequirement!, max: parseInt(e.target.value) || 0 }})}
                        className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAddItemOpen(false); setImportMode(false); }} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : (importMode ? 'Import Items' : 'Add to Inventory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {isRecordMovementOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Stock Movement</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inbound / Outbound</p>
                </div>
              </div>
              <button onClick={() => setIsRecordMovementOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all"><Plus size={28} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleRecordMovement} className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Item</label>
                  <select 
                    required
                    value={newMovementData.itemId}
                    onChange={e => setNewMovementData({...newMovementData, itemId: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  >
                    <option value="">Select SKU</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Movement Type</label>
                    <select 
                      value={newMovementData.type}
                      onChange={e => setNewMovementData({...newMovementData, type: e.target.value as any})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="INBOUND">Inbound (+)</option>
                      <option value="OUTBOUND">Outbound (-)</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number" required
                      value={isNaN(newMovementData.qty as number) ? '' : newMovementData.qty}
                      onChange={e => setNewMovementData({...newMovementData, qty: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Reference</label>
                  <input 
                    type="text"
                    value={newMovementData.notes}
                    onChange={e => setNewMovementData({...newMovementData, notes: e.target.value})}
                    placeholder="e.g. PO #12345"
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsRecordMovementOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Bin Modal */}
      {isAddBinOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Add Bin Location</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define new storage space</p>
                </div>
              </div>
              <button onClick={() => setIsAddBinOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all"><Plus size={28} className="rotate-45" /></button>
            </div>
            
            <form onSubmit={handleAddBin} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone</label>
                  <input 
                    type="text" required
                    value={newBinData.zone}
                    onChange={e => setNewBinData({...newBinData, zone: e.target.value.toUpperCase()})}
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Aisle</label>
                  <input 
                    type="text" required
                    value={newBinData.aisle}
                    onChange={e => setNewBinData({...newBinData, aisle: e.target.value})}
                    placeholder="e.g. 01"
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shelf</label>
                  <input 
                    type="text" required
                    value={newBinData.shelf}
                    onChange={e => setNewBinData({...newBinData, shelf: e.target.value.toUpperCase()})}
                    placeholder="e.g. B"
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bin</label>
                  <input 
                    type="text" required
                    value={newBinData.bin}
                    onChange={e => setNewBinData({...newBinData, bin: e.target.value})}
                    placeholder="e.g. 05"
                    className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bin Type</label>
                <select 
                  value={newBinData.type}
                  onChange={e => setNewBinData({...newBinData, type: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                >
                  <option value="PICKING">Picking Bin</option>
                  <option value="BULK">Bulk Storage</option>
                  <option value="BUFFER">Buffer Zone</option>
                  <option value="COLD_STORAGE">Cold Storage</option>
                  <option value="HAZMAT">Hazardous Materials</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity (Units)</label>
                <input 
                  type="number" required
                  value={isNaN(newBinData.capacity) ? '' : newBinData.capacity}
                  onChange={e => setNewBinData({...newBinData, capacity: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddBinOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Create Bin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </Layout>
);
};

export default WarehouseManagement;
