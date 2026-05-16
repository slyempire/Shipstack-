
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuditStore, useAuthStore, useAppStore } from '../../store';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  Edit2, 
  Shield, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  History,
  MoreVertical,
  Mail,
  Smartphone,
  ShieldCheck,
  Lock,
  ArrowRight,
  X,
  CreditCard,
  Hash,
  MapPin,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';
import { ROLE_DEFINITIONS } from '../../constants/rbac';
import { User, SystemRole, UserRole } from '../../types';
import { api } from '../../api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'dispatcher' as UserRole,
    phone: '',
    idNumber: '',
    kraPin: '',
    licenseNumber: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    verificationStatus: 'PENDING'
  });

  const logAction = useAuditStore(state => state.logAction);
  const { currentTenant } = useAuthStore(state => ({ currentTenant: state.user?.tenantId }));
  const { addNotification } = useAppStore();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUsers(currentTenant || 'tenant-1');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addNotification('Failed to load personnel data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentTenant]);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'dispatcher' as UserRole,
        phone: '',
        idNumber: '',
        kraPin: '',
        licenseNumber: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        emergencyContact: '',
        emergencyPhone: '',
        address: '',
        verificationStatus: 'PENDING'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData, currentTenant || 'tenant-1');
        logAction('UPDATE_USER', 'user', editingUser.id, { email: formData.email });
        addNotification('Personnel updated successfully', 'success');
      } else {
        const newUser = await api.createUser(formData, currentTenant || 'tenant-1');
        logAction('CREATE_USER', 'user', newUser.id, { email: formData.email });
        addNotification('New personnel provisioned', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Personnel update failed:', error);
      addNotification('Operation failed', 'error');
    }
  };

  const handleStatusToggle = async (user: User) => {
    try {
      const newStatus = user.verificationStatus === 'VERIFIED' ? 'REJECTED' : 'VERIFIED';
      await api.updateUser(user.id, { verificationStatus: newStatus }, currentTenant || 'tenant-1');
      logAction('TOGGLE_USER_VERIFICATION', 'user', user.id, { status: newStatus });
      fetchUsers();
    } catch (error) {
       addNotification('Status update failed', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Permanently decommission this operator? This will rescind all security clearances instantly.')) {
      try {
        await api.deleteUser(userId, currentTenant || 'tenant-1');
        logAction('DELETE_USER', 'user', userId, {}, 'critical');
        addNotification('Personnel decommissioned', 'warning');
        fetchUsers();
      } catch (error) {
        addNotification('Decommission failed', 'error');
      }
    }
  };

  return (
    <RoleGuard permissions={['users:view']} showFullPageError>
      <Layout 
        title="Command Personnel" 
        subtitle="Manage security clearaces & operational roles for your cluster"
      >
        <div className="space-y-10 pb-24">
          {/* Header Action Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
             <div className="relative flex-1 w-full max-w-lg">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name, email, or role profile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none transition-all font-medium text-sm"
                />
             </div>
             <div className="flex items-center gap-4 w-full lg:w-auto">
                <RoleGuard permissions={['users:manage']}>
                  <button 
                    onClick={() => handleOpenModal()}
                    className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} /> Provision User
                  </button>
                </RoleGuard>
             </div>
          </div>

          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             {isLoading ? (
               Array(6).fill(0).map((_, i) => (
                 <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse" />
               ))
             ) : (
               filteredUsers.map((user) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onToggleStatus={() => handleStatusToggle(user)}
                    onDelete={() => deleteUser(user.id)}
                    onEdit={() => handleOpenModal(user)}
                  />
               ))
             )}
             {!isLoading && filteredUsers.length === 0 && (
                <div className="col-span-full py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center">
                   <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300">
                      <Users size={40} />
                   </div>
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">No active personnel found</p>
                </div>
             )}
          </div>
        </div>

        {/* Modal for Add/Edit */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-8 border-b border-slate-100">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                      {editingUser ? 'Update Personnel' : 'Provision User'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identity Management Protocol</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                       <div className="relative">
                          <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            required
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                       <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            required
                            type="email" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@shipstack.io"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                       <div className="relative">
                          <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            required
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+254 7XX XXX XXX"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</label>
                       <div className="relative">
                          <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <select 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all appearance-none"
                            value={formData.role || 'dispatcher'}
                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                          >
                             {Object.keys(ROLE_DEFINITIONS).map(role => (
                               <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                       <div className="relative">
                          <History size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="date" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.dateOfBirth || ''}
                            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                       <div className="relative">
                          <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <select 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all appearance-none"
                            value={formData.gender || ''}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          >
                             <option value="">Select Gender</option>
                             <option value="male">Male</option>
                             <option value="female">Female</option>
                             <option value="other">Other</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nationality</label>
                       <div className="relative">
                          <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.nationality || ''}
                            onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                            placeholder="Kenyan"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Contact</label>
                       <div className="relative">
                          <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.emergencyContact || ''}
                            onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                            placeholder="Next of Kin Name"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Phone</label>
                       <div className="relative">
                          <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.emergencyPhone || ''}
                            onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            placeholder="+254 7XX XXX XXX"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID Number</label>
                       <div className="relative">
                          <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.idNumber || ''}
                            onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">KRA PIN</label>
                       <div className="relative">
                          <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                            value={formData.kraPin || ''}
                            onChange={e => setFormData({ ...formData, kraPin: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">License Number</label>
                       <div className="relative">
                          <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input 
                             type="text" 
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                             value={formData.licenseNumber || ''}
                             onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Residential Address</label>
                       <div className="relative">
                          <MapPin size={16} className="absolute left-4 top-4 text-slate-300" />
                          <textarea 
                             rows={2}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-medium text-sm transition-all"
                             value={formData.address || ''}
                             onChange={e => setFormData({ ...formData, address: e.target.value })}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all">
                       {editingUser ? 'Seal Identity Update' : 'Finalize Provisioning'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Layout>
    </RoleGuard>
  );
};

const UserCard = ({ user, onToggleStatus, onDelete, onEdit }: { user: User, onToggleStatus: () => void, onDelete: () => void, onEdit: () => void }) => {
  const roleDef = ROLE_DEFINITIONS[user.role as SystemRole];
  const isRejected = user.verificationStatus === 'REJECTED';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-[2.5rem] p-8 border transition-all ${isRejected ? 'border-red-100 bg-red-50/10 grayscale-[0.8]' : 'border-slate-200 shadow-sm hover:shadow-xl'}`}
    >
       <div className="flex items-start justify-between mb-8">
          <div className="h-16 w-16 rounded-[1.25rem] bg-slate-100 overflow-hidden border-2 border-white shadow-lg">
             <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} className="h-full w-full object-cover" />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isRejected ? 'bg-red text-white' : 'bg-emerald-50 text-emerald-500'}`}>
             {user.verificationStatus}
          </div>
       </div>

       <div className="space-y-4 mb-8">
          <div>
             <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900 leading-none">{user.name}</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.email}</p>
          </div>
          
          <div className="flex items-center gap-2 text-brand">
             <ShieldCheck size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">{(user.role || '').replace('_', ' ')}</span>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-8 text-slate-400">
          <div className="flex items-center gap-2">
             <Smartphone size={12} />
             <span className="text-[9px] font-bold">{user.phone || 'No Contact'}</span>
          </div>
          <div className="flex items-center gap-2">
             <History size={12} />
             <span className="text-[9px] font-bold text-slate-300">Active Today</span>
          </div>
       </div>

       <div className="flex gap-2">
          <button 
            onClick={onToggleStatus}
            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRejected ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-red-50 text-red hover:bg-red hover:text-white'}`}
          >
            {isRejected ? 'Verify' : 'Deactivate'}
          </button>
          <button 
            onClick={onEdit}
            className="h-12 w-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
          >
             <Edit2 size={16} />
          </button>
          <RoleGuard permissions={['users:manage']}>
             <button 
               onClick={onDelete}
               className="h-12 w-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red hover:text-white transition-all"
             >
                <Trash2 size={16} />
             </button>
          </RoleGuard>
       </div>
    </motion.div>
  );
};

export default UserManagement;
