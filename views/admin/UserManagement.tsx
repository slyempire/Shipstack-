
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuditStore, useAuthStore } from '../../store';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';
import { ROLE_DEFINITIONS } from '../../constants/rbac';
import { SystemRole } from '../../types';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: 'active' | 'suspended';
  lastActive: string;
  phone?: string;
  avatar?: string;
}

const MOCK_USERS: ManagedUser[] = [
  { id: '1', name: 'Joe Mugoh', email: 'joemugoh215@gmail.com', role: 'tenant_admin', status: 'active', lastActive: new Date().toISOString() },
  { id: '2', name: 'Sarah Wambui', email: 'sarah.w@farmcare.com', role: 'operations_manager', status: 'active', lastActive: '2026-04-18T14:30:00Z' },
  { id: '3', name: 'James Kimani', email: 'james.k@farmcare.com', role: 'dispatcher', status: 'active', lastActive: '2026-04-19T08:15:00Z' },
  { id: '4', name: 'Alice Mutua', email: 'alice.m@farmcare.com', role: 'finance_manager', status: 'suspended', lastActive: '2026-04-10T12:00:00Z' },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const { logAction } = useAuditStore();
  const { currentUserRole } = useAuthStore();

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'suspended' : 'active';
        logAction('update_user_status', 'user', userId, { from: u.status, to: newStatus }, 'warning');
        return { ...u, status: newStatus as any };
      }
      return u;
    }));
  };

  const deleteUser = (userId: string) => {
    if (confirm('Permanently decommission this operator? This will rescind all security clearances instantly.')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      logAction('delete_user', 'user', userId, {}, 'critical');
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
                    onClick={() => setIsAddingUser(true)}
                    className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} /> Provision User
                  </button>
                </RoleGuard>
             </div>
          </div>

          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             {filteredUsers.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onToggleStatus={() => handleStatusToggle(user.id)}
                  onDelete={() => deleteUser(user.id)}
                />
             ))}
             {filteredUsers.length === 0 && (
                <div className="col-span-full py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center">
                   <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300">
                      <Users size={40} />
                   </div>
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">No active personnel found</p>
                </div>
             )}
          </div>

          {/* RBAC Intelligence Sidebar Placeholder / Info */}
          <section className="bg-brand/5 border border-brand/10 p-12 rounded-[3.5rem] flex flex-col lg:flex-row items-center justify-between gap-12">
             <div className="lg:w-2/3 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-14 w-14 bg-brand text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                      <Shield size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">RBAC Intelligence Flow</h3>
                      <p className="text-[10px] font-bold text-brand-dark uppercase tracking-widest mt-1">Enterprise Access Governance</p>
                   </div>
                </div>
                <p className="text-lg font-medium text-slate-600 leading-relaxed max-w-2xl">
                  Permissions are hierarchically inherited. A <span className="text-slate-900 font-bold">Tenant Admin</span> can manage all assets, while an <span className="text-slate-900 font-bold">Operations Manager</span> is restricted to purely logistical hubs. All escalations are audited globally.
                </p>
                <div className="flex flex-wrap gap-3">
                   {Object.keys(ROLE_DEFINITIONS).map(role => (
                     <div key={role} className="px-4 py-2 bg-white rounded-xl border border-brand/10 text-[9px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                        {role.replace('_', ' ')}
                     </div>
                   ))}
                </div>
             </div>
             <div className="lg:w-1/3 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Invariant</p>
                      <Lock size={12} className="text-amber-500" />
                   </div>
                   <p className="text-xs font-bold text-slate-900">Permissions cannot be individually assigned to users; they must align with pre-defined ROLE PROFILES to ensure audit integrity.</p>
                </div>
                <button className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group">
                   Review RBAC Schema <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </section>
        </div>
      </Layout>
    </RoleGuard>
  );
};

const UserCard = ({ user, onToggleStatus, onDelete }: { user: ManagedUser, onToggleStatus: () => void, onDelete: () => void }) => {
  const roleDef = ROLE_DEFINITIONS[user.role];
  const isSuspended = user.status === 'suspended';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-[2.5rem] p-8 border transition-all ${isSuspended ? 'border-red-100 bg-red-50/10 grayscale-[0.8]' : 'border-slate-200 shadow-sm hover:shadow-xl'}`}
    >
       <div className="flex items-start justify-between mb-8">
          <div className="h-16 w-16 rounded-[1.25rem] bg-slate-100 overflow-hidden border-2 border-white shadow-lg">
             <img src={`https://i.pravatar.cc/150?u=${user.email}`} className="h-full w-full object-cover" />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isSuspended ? 'bg-red text-white' : 'bg-emerald-50 text-emerald-500'}`}>
             {user.status}
          </div>
       </div>

       <div className="space-y-4 mb-8">
          <div>
             <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900 leading-none">{user.name}</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.email}</p>
          </div>
          
          <div className="flex items-center gap-2 text-brand">
             <ShieldCheck size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-8 text-slate-400">
          <div className="flex items-center gap-2">
             <Smartphone size={12} />
             <span className="text-[9px] font-bold">+254 7XX ...</span>
          </div>
          <div className="flex items-center gap-2">
             <History size={12} />
             <span className="text-[9px] font-bold text-slate-300">Active Today</span>
          </div>
       </div>

       <div className="flex gap-2">
          <button 
            onClick={onToggleStatus}
            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-red-50 text-red hover:bg-red hover:text-white'}`}
          >
            {isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
          <button className="h-12 w-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all">
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
