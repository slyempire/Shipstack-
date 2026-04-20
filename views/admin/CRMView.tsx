
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore, useAuthStore } from '../../store';
import { Modal } from '../../components/Modal';
import RoleGuard from '../../components/RoleGuard';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  TrendingUp, 
  MessageSquare,
  Clock,
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  XCircle,
  Save,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  totalRevenue: number;
  orderCount: number;
  lastInteraction: string;
}

const CRMView: React.FC = () => {
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LEAD'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'LEAD'
  });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await api.getCustomers();
        setCustomers(data);
      } catch (error) {
        addNotification('Failed to load customers.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, [user?.id]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(customer);
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'LEAD'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestId = `crm-${Date.now()}`;
    try {
      if (selectedCustomer) {
        const updated = await api.updateCustomer(selectedCustomer.id, formData, requestId);
        setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
        addNotification('Relationship updated successfully.', 'success');
      } else {
        const newCustomer = await api.createCustomer(formData, 'tenant-1', requestId);
        setCustomers([newCustomer, ...customers]);
        addNotification('New relationship established.', 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      addNotification('Failed to save relationship.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this relationship?')) {
      const requestId = `crm-del-${Date.now()}`;
      try {
        await api.deleteCustomer(id, requestId);
        setCustomers(customers.filter(c => c.id !== id));
        addNotification('Relationship removed.', 'info');
      } catch (error) {
        addNotification('Failed to remove relationship.', 'error');
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout title="Relationship Management" subtitle="Manage clients, leads, and customer interactions">
      <div className="space-y-8">
        {/* CRM Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Clients</p>
            <p className="text-3xl font-black text-slate-900">{customers.length}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Pipeline</p>
            <p className="text-3xl font-black text-slate-900">${customers.reduce((acc, c) => acc + c.totalRevenue, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <Briefcase size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Leads</p>
            <p className="text-3xl font-black text-slate-900">{customers.filter(c => c.status === 'LEAD').length}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="h-12 w-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={24} />
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Avg. Response</p>
              <p className="text-3xl font-black">1.4 hrs</p>
            </div>
            <TrendingUp className="absolute -right-8 -bottom-8 text-white/5" size={160} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search clients or leads..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 p-1 bg-white border border-slate-100 rounded-xl">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('ACTIVE')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'ACTIVE' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Clients
              </button>
              <button 
                onClick={() => setFilter('LEAD')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'LEAD' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Leads
              </button>
            </div>
            <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'FINANCE']}>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-brand text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={16} /> Add Relationship
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* Customer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <motion.div 
                key={customer.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand/5 group-hover:text-brand transition-colors">
                    <Users size={28} />
                  </div>
                  <Badge variant={customer.status === 'ACTIVE' ? 'delivered' : 'neutral'}>
                    {customer.status}
                  </Badge>
                </div>

                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">{customer.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={12} /> {customer.address}
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Mail size={14} className="text-slate-300" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <Phone size={14} className="text-slate-300" />
                    {customer.phone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                    <p className="text-sm font-black text-slate-900">${customer.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                    <p className="text-sm font-black text-slate-900">{customer.orderCount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Last: {new Date(customer.lastInteraction).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                      className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'FINANCE']}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }}
                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-brand hover:text-white transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </RoleGuard>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedCustomer ? 'Edit Relationship' : 'Add Relationship'}
        >
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                >
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active Client</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="tel" required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
              <textarea 
                required
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all h-24 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-brand text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} /> {selectedCustomer ? 'Update Relationship' : 'Establish Relationship'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CRMView;
