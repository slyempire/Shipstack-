
import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../api';
import { Tenant, IndustryType, ModuleId } from '../../types';
import { 
  Building2, 
  Settings2, 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Loader2,
  Check,
  ChevronRight,
  Globe,
  Zap,
  MoreVertical,
  Activity,
  Layers,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../../components/Modal';

const AVAILABLE_MODULES: { id: ModuleId; name: string; category: string }[] = [
  { id: 'dashboard', name: 'Dashboard', category: 'Core' },
  { id: 'dispatch', name: 'Dispatch', category: 'Operations' },
  { id: 'warehouse', name: 'Warehouse', category: 'Operations' },
  { id: 'orders', name: 'Orders', category: 'Core' },
  { id: 'fleet', name: 'Fleet', category: 'Operations' },
  { id: 'finance', name: 'Finance', category: 'Backoffice' },
  { id: 'driver-portal', name: 'Driver Portal', category: 'Portals' },
  { id: 'facility-portal', name: 'Facility Portal', category: 'Portals' },
  { id: 'client-portal', name: 'Client Portal', category: 'Portals' },
  { id: 'analytics', name: 'Analytics', category: 'Intelligence' },
  { id: 'integrations', name: 'Integrations', category: 'Intelligence' },
  { id: 'addon-cortex-ai', name: 'Cortex AI', category: 'AI' }
];

const INDUSTRIES: IndustryType[] = [
  'MEDICAL', 'PHARMA', 'MANUFACTURING', 'FOOD', 'RETAIL', 'CONSTRUCTION', 
  'E-COMMERCE', 'PROCESSING', 'AGRICULTURE', 'HEALTHCARE', 'GENERAL'
];

const PLANS = ['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'] as const;

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useAppStore();

  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    slug: '',
    plan: 'GROWTH',
    status: 'ACTIVE',
    industry: 'GENERAL',
    enabledModules: ['dashboard', 'dispatch']
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants();
      setTenants(data);
    } catch (err) {
      addNotification('Failed to fetch tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      industry: tenant.industry,
      enabledModules: tenant.enabledModules
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action is irreversible.')) return;
    try {
      await api.deleteTenant(id);
      addNotification('Tenant deleted successfully', 'success');
      fetchTenants();
    } catch (err) {
      addNotification('Failed to delete tenant', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedTenant) {
        await api.updateTenant(selectedTenant.id, formData);
        addNotification('Tenant updated successfully', 'success');
      } else {
        await api.createTenant(formData);
        addNotification('Tenant created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (err) {
      addNotification('Failed to save tenant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleId: ModuleId) => {
    const modules = [...(formData.enabledModules || [])];
    if (modules.includes(moduleId)) {
      setFormData({ ...formData, enabledModules: modules.filter(m => m !== moduleId) });
    } else {
      setFormData({ ...formData, enabledModules: [...modules, moduleId] });
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Multi-Tenant Oracle" subtitle="Centralized nexus for managing platform instances">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => {
                setSelectedTenant(null);
                setFormData({
                  name: '',
                  slug: '',
                  plan: 'GROWTH',
                  status: 'ACTIVE',
                  industry: 'GENERAL',
                  enabledModules: ['dashboard', 'dispatch']
                });
                setIsModalOpen(true);
              }}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
            >
              <Plus size={16} /> Provision Tenant
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Clusters', value: tenants.length, icon: Globe, color: 'brand' },
            { label: 'Enterprise Tier', value: tenants.filter(t => t.plan === 'ENTERPRISE').length, icon: Zap, color: 'amber' },
            { label: 'Modules Deployed', value: tenants.reduce((acc, t) => acc + (t.enabledModules?.length || 0), 0), icon: Layers, color: 'blue' },
            { label: 'System Health', value: '99.9%', icon: Activity, color: 'emerald' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}/10 text-${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-brand mb-4" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Synchronizing Tenant Network...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tier & Industry</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Stack Status</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Modules</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg font-black`}>
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[13px] font-black text-slate-900">{tenant.name}</div>
                            <div className="text-[11px] font-bold text-slate-400">{tenant.slug}.shipstack.io</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                              tenant.plan === 'ENTERPRISE' ? 'bg-amber-100 text-amber-700' : 
                              tenant.plan === 'SCALE' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tenant.plan}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{tenant.industry}</div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            tenant.status === 'ACTIVE' || tenant.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
                          }`} />
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{tenant.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {tenant.enabledModules?.slice(0, 3).map(m => (
                            <span key={m} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-100">
                              {m}
                            </span>
                          ))}
                          {(tenant.enabledModules?.length || 0) > 3 && (
                            <span className="text-[10px] font-bold text-slate-400">+{tenant.enabledModules.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(tenant)}
                            className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tenant.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTenants.length === 0 && (
              <div className="py-20 text-center">
                <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching organizations found</p>
              </div>
            )}
          </div>
        )}

        {/* Provisioning Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title={selectedTenant ? "Edit Organization Configuration" : "Provision New Cluster"}
        >
          <form onSubmit={handleSubmit} className="space-y-8 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Industry Vertical</label>
                <select 
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value as IndustryType })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Plan</label>
                <select 
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                >
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cluster Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                >
                  <option value="ACTIVE">ACTIVE (Operational)</option>
                  <option value="SUSPENDED">SUSPENDED (Locked)</option>
                  <option value="TRIAL">TRIAL (Evaluation)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Module Deployment</label>
                <span className="text-[10px] font-bold text-brand uppercase">{formData.enabledModules?.length || 0} Enabled</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODULES.map(module => {
                  const isEnabled = formData.enabledModules?.includes(module.id);
                  return (
                    <div 
                      key={module.id}
                      onClick={() => toggleModule(module.id)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isEnabled ? 'bg-brand/5 border-brand shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isEnabled ? 'text-brand' : 'text-slate-400'}`}>
                          {module.category}
                        </span>
                        {isEnabled && <Check size={12} className="text-brand" />}
                      </div>
                      <div className={`text-[11px] font-black ${isEnabled ? 'text-brand' : 'text-slate-900'}`}>{module.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Settings2 size={16} />}
                {selectedTenant ? 'Re-provision Cluster' : 'Commit Provisioning'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default TenantManagement;
