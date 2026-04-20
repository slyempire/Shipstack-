
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { Order, DeliveryItem } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore, useAuthStore } from '../../store';
import { useTenant } from '../../hooks/useTenant';
import RoleGuard from '../../components/RoleGuard';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Clock,
  User,
  Package,
  RefreshCw
} from 'lucide-react';

const OrderManagement: React.FC = () => {
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();
  const { tenant, formatCurrency, currencySymbol } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    customerName: '',
    items: [{ name: '', qty: 1, unit: 'unit', sku: '' }],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => { 
    if (tenant?.id) loadOrders(); 
  }, [tenant?.id]);

  const loadOrders = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await api.getOrders(tenant.id);
      setOrders(data);
    } catch (err) {
      addNotification("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (order: Order) => {
    const requestId = `ord-app-${order.id}-${Date.now()}`;
    try {
      await api.batchApproveOrders([order.id], user?.role, requestId);
      addNotification(`Order ${order.externalId} approved and queued for dispatch.`, "success");
      loadOrders();
    } catch (err) {
      addNotification("Approval failed", "error");
    }
  };

  const handleBatchApprove = async () => {
    if (selectedOrders.length === 0) return;
    setBatchProcessing(true);
    const requestId = `ord-batch-${Date.now()}`;
    try {
      await api.batchApproveOrders(selectedOrders, user?.role, requestId);
      addNotification(`Batch approved ${selectedOrders.length} orders for dispatch.`, "success");
      setSelectedOrders([]);
      loadOrders();
    } catch (err) {
      addNotification("Batch approval failed", "error");
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleOrderSelection = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(oid => oid !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = `ord-create-${Date.now()}`;
    try {
      await api.createOrder({
        ...newOrderData,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        fraudScore: Math.floor(Math.random() * 20)
      }, tenant?.id || 'tenant-1', requestId);
      addNotification("New sales order created successfully.", "success");
      setIsCreateModalOpen(false);
      setNewOrderData({
        customerName: '',
        items: [{ name: '', qty: 1, unit: 'unit', sku: '' }],
        totalAmount: 0,
        notes: ''
      });
      loadOrders();
    } catch (err) {
      addNotification("Failed to create order", "error");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.externalId.toLowerCase().includes(search.toLowerCase()) || 
                         o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Order Orchestration Hub">
      <div className="space-y-8">
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Pending Approval" value={orders.filter(o => o.status === 'PENDING').length} icon={Clock} color="text-orange-500" />
          <StatCard label="Total Revenue" value={formatCurrency(orders.reduce((acc, o) => acc + o.totalAmount, 0))} icon={CreditCard} color="text-emerald-500" />
          <StatCard label="Avg Fraud Score" value={(orders.reduce((acc, o) => acc + (o.fraudScore || 0), 0) / orders.length || 0).toFixed(1)} icon={ShieldCheck} color="text-blue-500" />
          <StatCard label="Total Orders" value={orders.length} icon={ShoppingBag} color="text-slate-500" />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by Order ID or Customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all"
              />
            </div>
            <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER']}>
              {selectedOrders.length > 0 && (
                <button 
                  onClick={handleBatchApprove}
                  disabled={batchProcessing}
                  className="bg-emerald-500 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all animate-in slide-in-from-left-4"
                >
                  {batchProcessing ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Batch Approve ({selectedOrders.length})
                </button>
              )}
            </RoleGuard>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER']}>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-brand text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={16} /> New Sales Order
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6 w-12">
                  <div 
                    onClick={() => {
                      if (selectedOrders.length === filteredOrders.length) {
                        setSelectedOrders([]);
                      } else {
                        setSelectedOrders(filteredOrders.map(o => o.id));
                      }
                    }}
                    className={`h-5 w-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${selectedOrders.length === filteredOrders.length ? 'bg-brand border-brand' : 'border-slate-300'}`}
                  >
                    {selectedOrders.length === filteredOrders.length && <CheckCircle size={12} className="text-white" />}
                  </div>
                </th>
                <th className="px-8 py-6 label-logistics">Order Reference</th>
                <th className="px-8 py-6 label-logistics">Customer</th>
                <th className="px-8 py-6 label-logistics">Amount</th>
                <th className="px-8 py-6 label-logistics">Status</th>
                <th className="px-8 py-6 label-logistics">Risk</th>
                <th className="px-8 py-6 label-logistics text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? [1,2,3].map(i => <SkeletonRow key={i} />) :
                filteredOrders.map(order => (
                  <tr key={order.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${selectedOrders.includes(order.id) ? 'bg-brand/5' : ''}`}>
                    <td className="px-8 py-6">
                      <div 
                        onClick={() => toggleOrderSelection(order.id)}
                        className={`h-5 w-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${selectedOrders.includes(order.id) ? 'bg-brand border-brand' : 'border-slate-300'}`}
                      >
                        {selectedOrders.includes(order.id) && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400"><ShoppingBag size={18} /></div>
                        <div>
                          <span className="body-value truncate-name block">{order.externalId}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-300 dark:text-slate-600" />
                        <span className="body-value truncate-name">{order.customerName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="body-value">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant={order.status === 'APPROVED' ? 'delivered' : order.status === 'PENDING' ? 'neutral' : 'failed'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${order.fraudScore && order.fraudScore > 20 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase">{order.fraudScore || 0}% Score</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                          className="p-2 text-slate-400 hover:text-brand bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER']}>
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleApprove(order)}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-500/20 rounded-lg shadow-sm transition-all"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">Order {selectedOrder.externalId}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer: {selectedOrder.customerName}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-brand transition-all"><XCircle size={28} /></button>
            </div>

            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-3 gap-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Status</p>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-brand" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">{selectedOrder.paymentStatus}</span>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fraud Analysis</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">{selectedOrder.fraudScore}% Risk</span>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Created At</p>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} /> Order Items
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</td>
                          <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{item.sku}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-white text-right">{item.qty} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
              <button onClick={() => setIsDetailOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Close</button>
              {selectedOrder.status === 'PENDING' && (
                <button 
                  onClick={() => { handleApprove(selectedOrder); setIsDetailOpen(false); }}
                  className="bg-brand text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                >
                  Approve & Dispatch <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">New Sales Order</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Entry</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-brand transition-all"><XCircle size={28} /></button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                    <input 
                      type="text" required
                      value={newOrderData.customerName}
                      onChange={e => setNewOrderData({...newOrderData, customerName: e.target.value})}
                      placeholder="e.g. City Hospital"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount ({currencySymbol})</label>
                    <input 
                      type="number" required
                      value={isNaN(newOrderData.totalAmount) ? '' : newOrderData.totalAmount}
                      onChange={e => setNewOrderData({...newOrderData, totalAmount: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {newOrderData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex-1 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
                          <input 
                            type="text"
                            value={item.name}
                            onChange={e => {
                              const items = [...newOrderData.items];
                              items[idx].name = e.target.value;
                              setNewOrderData({...newOrderData, items});
                            }}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SKU</label>
                          <input 
                            type="text"
                            value={item.sku}
                            onChange={e => {
                              const items = [...newOrderData.items];
                              items[idx].sku = e.target.value;
                              setNewOrderData({...newOrderData, items});
                            }}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <div className="w-16 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                          <input 
                            type="number"
                            value={isNaN(item.qty) ? '' : item.qty}
                            onChange={e => {
                              const items = [...newOrderData.items];
                              items[idx].qty = parseInt(e.target.value) || 0;
                              setNewOrderData({...newOrderData, items});
                            }}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const items = newOrderData.items.filter((_, i) => i !== idx);
                            setNewOrderData({...newOrderData, items});
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewOrderData({...newOrderData, items: [...newOrderData.items, { name: '', qty: 1, unit: 'unit', sku: '' }]})}
                      className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                  <textarea 
                    value={newOrderData.notes}
                    onChange={e => setNewOrderData({...newOrderData, notes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button 
                  type="submit"
                  className="flex-[2] bg-brand text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
    <div className={`h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${color} shadow-inner`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="label-logistics text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td colSpan={6} className="px-8 py-6">
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
    </td>
  </tr>
);

export default OrderManagement;
