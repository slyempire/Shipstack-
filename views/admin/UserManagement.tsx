
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { User, UserRole } from '../../types';
import { Badge } from '../../packages/ui/Badge';
import { useAppStore } from '../../store';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Shield, 
  Mail, 
  Building, 
  X,
  Check,
  RefreshCw,
  MoreVertical
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { addNotification } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'DRIVER',
    company: '',
    facilityId: '',
    password: 'password',
    verificationStatus: 'PENDING'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleOpenForm = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || '',
        facilityId: user.facilityId || '',
        password: user.password || 'password',
        verificationStatus: user.verificationStatus || 'PENDING'
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'DRIVER',
        company: '',
        facilityId: '',
        password: 'password',
        verificationStatus: 'PENDING'
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        addNotification('User updated successfully', 'success');
      } else {
        await api.createUser(formData);
        addNotification('New user created', 'success');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      addNotification('Error saving user', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? Access will be revoked immediately.')) {
      await api.deleteUser(id);
      addNotification('User access revoked', 'info');
      loadData();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roles: UserRole[] = ['ADMIN', 'DISPATCHER', 'FINANCE', 'FACILITY', 'DRIVER', 'CLIENT'];

  return (
    <Layout title="RBAC & Access Control">
      <div className="space-y-6 h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <p className="text-sm font-medium text-neutral-muted">Configure access controls and personnel assignments across the network.</p>
           </div>
           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Find identity..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:ring-1 focus:ring-brand/20 transition-all"
                />
              </div>
              <button 
                onClick={() => handleOpenForm()}
                className="bg-brand text-white px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <UserPlus size={14} /> Add User
              </button>
           </div>
        </div>

        {/* Users Grid/Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
           <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left table-fixed">
                 <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                       <th className="p-4 w-1/4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                       <th className="p-4 w-1/6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Role</th>
                       <th className="p-4 w-1/4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Assignment</th>
                       <th className="p-4 w-1/6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Status</th>
                       <th className="p-4 w-24"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {loading ? (
                       <tr><td colSpan={5} className="p-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Syncing Identity Service...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                       <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase text-[10px]">No personnel matches found</td></tr>
                    ) : (
                       filteredUsers.map(user => (
                          <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm uppercase">
                                      {user.name.charAt(0)}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 leading-none mb-1 truncate">{user.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4">
                                <Badge variant={user.role.toLowerCase() as any}>{user.role}</Badge>
                             </td>
                             <td className="p-4">
                                <div className="flex items-center gap-2 text-slate-600">
                                   <Building size={12} className="text-slate-300" />
                                   <span className="text-[11px] font-bold">{user.company || user.facilityId || 'Global Operations'}</span>
                                </div>
                             </td>
                             <td className="p-4">
                                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase ${user.verificationStatus === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                   <div className={`h-1.5 w-1.5 rounded-full ${user.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                   {user.verificationStatus || 'PENDING'}
                                </div>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={() => handleOpenForm(user)}
                                      className="p-2 text-slate-400 hover:text-brand bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                   >
                                      <Edit2 size={12} />
                                   </button>
                                   <button 
                                      onClick={() => handleDelete(user.id)}
                                      className="p-2 text-slate-400 hover:text-logistics-red bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                   >
                                      <Trash2 size={12} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* User Form Slide-over/Modal */}
        {isFormOpen && (
           <div className="fixed inset-0 z-[100] bg-brand/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                 <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center">
                          <Shield size={20} />
                       </div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-brand">
                          {editingUser ? 'Update Security Profile' : 'New Identity Creation'}
                       </h3>
                    </div>
                    <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-brand"><X size={24} /></button>
                 </div>

                 <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                          <input 
                             type="text" 
                             required
                             value={formData.name}
                             onChange={(e) => setFormData({...formData, name: e.target.value})}
                             placeholder="e.g. John Smith"
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email Address</label>
                          <input 
                             type="email" 
                             required
                             value={formData.email}
                             onChange={(e) => setFormData({...formData, email: e.target.value})}
                             placeholder="name@meds.com"
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                             <select 
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                             >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment Unit</label>
                             <input 
                                type="text" 
                                value={formData.company}
                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                placeholder="Facility/Client ID"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                             />
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Pin / Password</label>
                          <input 
                             type="password" 
                             required
                             value={formData.password}
                             onChange={(e) => setFormData({...formData, password: e.target.value})}
                             placeholder="••••••••"
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Status</label>
                          <select 
                             value={formData.verificationStatus}
                             onChange={(e) => setFormData({...formData, verificationStatus: e.target.value as any})}
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all"
                          >
                             <option value="PENDING">PENDING VERIFICATION</option>
                             <option value="VERIFIED">VERIFIED IDENTITY</option>
                             <option value="REJECTED">ACCESS REJECTED</option>
                          </select>
                       </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                       <button 
                          type="button"
                          onClick={() => setIsFormOpen(false)}
                          className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400"
                       >
                          Cancel
                       </button>
                       <button 
                          type="submit"
                          className="flex-[2] bg-brand text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/10 hover:opacity-90 active:scale-95 transition-all"
                       >
                          {editingUser ? 'Apply Changes' : 'Finalize Identity'}
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

export default UserManagement;
