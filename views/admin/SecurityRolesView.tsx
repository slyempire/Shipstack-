
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuthStore, useAppStore, useAuditStore } from '../../store';
import { 
  Shield, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Info,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleGuard from '../../components/RoleGuard';
import { RoleDefinition, Permission } from '../../types';
import { ROLE_DEFINITIONS, getPermissionsForRole } from '../../constants/rbac';
import { api } from '../../api';

// Group permissions for easier management
const PERMISSION_GROUPS = {
  'Dashboard & Analytics': ['dashboard:view', 'dashboard:export', 'analytics:view', 'analytics:export', 'analytics:all'],
  'Operations & Dispatch': ['trips:view', 'trips:create', 'trips:edit', 'trips:delete', 'trips:assign', 'dispatch:view', 'dispatch:manage', 'dispatch:assign'],
  'Fleet & Maintenance': ['fleet:view', 'fleet:manage', 'fleet:all', 'maintenance:view', 'maintenance:manage'],
  'Inventory & Warehouse': ['warehouse:view', 'warehouse:manage', 'warehouse:all', 'orders:view', 'orders:create', 'orders:edit', 'orders:delete'],
  'Finance & Billing': ['finance:view', 'finance:manage', 'invoicing:view', 'invoicing:all', 'billing:view', 'billing:all', 'rates:view', 'rates:all'],
  'Users & Security': ['users:view', 'users:invite', 'users:edit', 'users:delete', 'users:manage', 'roles:view', 'roles:create', 'roles:edit', 'audit:view', 'audit:export', 'security:view'],
  'Marketplace & Integrations': ['marketplace:view', 'marketplace:install', 'marketplace:uninstall', 'marketplace:publish', 'marketplace:review', 'data_ingress:view', 'data_ingress:manage'],
  'Other': ['crm:view', 'crm:manage', 'exceptions:view', 'exceptions:resolve', 'recruitment:all', 'tracking:view', 'tasks:view', 'tasks:manage', 'subscription:view', 'subscription:manage']
};

interface SecurityRolesViewProps {
  embedded?: boolean;
}

const SecurityRolesView: React.FC<SecurityRolesViewProps> = ({ embedded }) => {
  const { user, fetchRoles, customRoles } = useAuthStore();
  const { addNotification } = useAppStore();
  const logAction = useAuditStore(state => state.logAction);
  
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<RoleDefinition>>({
    label: '',
    description: '',
    permissions: [],
    inherits: []
  });

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const allRoles = [
    ...Object.values(ROLE_DEFINITIONS),
    ...customRoles
  ];

  const filteredRoles = allRoles.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setSelectedRole(null);
    setFormData({
      label: '',
      description: '',
      permissions: [],
      inherits: []
    });
    setIsEditing(true);
  };

  const handleEditRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setFormData({
      label: role.label,
      description: role.description,
      permissions: role.permissions,
      inherits: role.inherits || []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.label) {
      addNotification('Role label is required', 'error');
      return;
    }

    try {
      setIsLoading(true);
      if (selectedRole?.isCustom) {
        await api.updateRole(selectedRole.role, formData, user?.tenantId);
        logAction('update_role', 'security', selectedRole.role, { label: formData.label });
        addNotification('Role updated successfully', 'success');
      } else {
        await api.createRole(formData, user?.tenantId);
        logAction('create_role', 'security', 'new', { label: formData.label });
        addNotification('Custom role created', 'success');
      }
      await fetchRoles();
      setIsEditing(false);
    } catch (error) {
      addNotification('Failed to save role', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (role: RoleDefinition) => {
    if (!role.isCustom) return;
    if (!confirm(`Are you sure you want to delete the "${role.label}" role? Users assigned to this role will lose access.`)) return;

    try {
      await api.deleteRole(role.role, user?.tenantId);
      logAction('delete_role', 'security', role.role);
      addNotification('Role deleted', 'warning');
      await fetchRoles();
    } catch (error) {
      addNotification('Failed to delete role', 'error');
    }
  };

  const togglePermission = (permission: Permission) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(permission)) {
        return { ...prev, permissions: current.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...current, permission] };
      }
    });
  };

  const Content = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
      {/* Role List Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search roles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent focus:border-brand/20 border-2 rounded-xl text-sm font-medium outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={handleCreateNew}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={16} /> Create Custom Role
          </button>
        </div>

        <div className="space-y-3">
          {filteredRoles.map(role => (
            <button
              key={role.role}
              onClick={() => handleEditRole(role)}
              className={`w-full p-6 rounded-3xl border text-left transition-all group ${
                selectedRole?.role === role.role 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  selectedRole?.role === role.role ? 'bg-white/10' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Shield size={20} />
                </div>
                {role.isCustom ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                      selectedRole?.role === role.role ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand'
                    }`}>
                      Tenant Custom
                    </span>
                    <span className={`text-[6px] font-bold opacity-50 ${selectedRole?.role === role.role ? 'text-white' : 'text-slate-400'}`}>
                      ID: {role.tenantId?.slice(-6).toUpperCase() || 'SYS'}
                    </span>
                  </div>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                    selectedRole?.role === role.role ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    System Base
                  </span>
                )}
              </div>
              <h4 className="font-black uppercase tracking-tighter text-lg leading-none mb-1">{role.label}</h4>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                selectedRole?.role === role.role ? 'text-white/60' : 'text-slate-400'
              }`}>
                {role.role}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Role Config Panel */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {selectedRole ? 'Refine Role Profile' : 'Forge Custom Role'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Security Clearance Specification
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedRole?.isCustom && (
                    <button 
                      onClick={() => handleDelete(selectedRole)}
                      className="h-12 w-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Role Display Name</label>
                    <input 
                      type="text" 
                      value={formData.label}
                      onChange={e => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g. Regional Supervisor"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-bold text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Role Internal Key</label>
                    <input 
                      type="text" 
                      value={selectedRole?.role || '(Auto-generated)'}
                      disabled
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-sm text-slate-400"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Scope of Authority</label>
                    <textarea 
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the responsibilities and boundaries of this role..."
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand/20 rounded-2xl outline-none font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Permission Matrix</h4>
                    <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest">
                      {formData.permissions?.length || 0} Level Clearances
                    </span>
                  </div>

                  <div className="space-y-10">
                    {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                      <div key={group} className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">{group}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map(p => {
                            const isChecked = formData.permissions?.includes(p as Permission);
                            return (
                              <button
                                key={p}
                                onClick={() => togglePermission(p as Permission)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                  isChecked 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-white border-slate-50 hover:border-slate-100'
                                }`}
                              >
                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-300'
                                }`}>
                                  {isChecked ? <CheckCircle2 size={14} /> : <Lock size={12} />}
                                </div>
                                <div>
                                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                                    isChecked ? 'text-emerald-700' : 'text-slate-500'
                                  }`}>
                                    {p.replace(':', ' / ').replace('_', ' ')}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Info size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">Changes will take effect upon the next terminal refresh</p>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : <><Save size={16} /> Seal Permission Protocol</>}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[80vh] flex flex-col items-center justify-center text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem] p-12"
            >
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl text-slate-200">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-400 mb-4">Select a target profile</h3>
              <p className="text-sm text-slate-400 font-medium max-w-sm mb-10 leading-relaxed">
                Choose an existing security profile to refine or create a new custom clearance level for your operational cluster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCreateNew}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
                >
                  <Plus size={16} /> Create Custom Role
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (embedded) return Content;

  return (
    <RoleGuard permissions={['roles:view']} showFullPageError>
      <Layout 
        title="Security Roles" 
        subtitle="Define granular access controls & custom permission profiles"
      >
        {Content}
      </Layout>
    </RoleGuard>
  );
};

export default SecurityRolesView;
