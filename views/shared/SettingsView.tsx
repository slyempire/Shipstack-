
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useAppStore, useTenantStore } from '../../store';
import { api } from '../../api';
import Layout from '../../components/Layout';
import { ModuleId, User, PermissionRequest } from '../../types';
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun,
  Globe, 
  Database, 
  CloudRain, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  HardDrive,
  Trash2,
  CreditCard,
  Building2,
  LayoutGrid,
  Lock,
  Route as RouteIcon,
  Truck,
  FileText,
  Warehouse,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

const SettingsView: React.FC = () => {
  const { user, login } = useAuthStore();
  const { currentTenant, updateTenant } = useTenantStore();
  const { addNotification } = useAppStore();
  const navigate = useNavigate();
  
  const [prefs, setPrefs] = useState(user?.preferences || {
    theme: 'LIGHT',
    notifications: { email: true, push: true, sms: false },
    highContrast: false,
    autoSync: true
  });

  const [tenantModules, setTenantModules] = useState<ModuleId[]>(currentTenant?.enabledModules || []);
  const [securitySettings, setSecuritySettings] = useState(currentTenant?.securitySettings || {
    auditLogging: true,
    twoFactorAuth: false,
    requireNTSAVerification: true
  });
  const [brandColor, setBrandColor] = useState(currentTenant?.settings?.primaryColor || '#0F2A44');

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModules, setUserModules] = useState<ModuleId[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.getUsers().then(setUsers);
      api.getPermissionRequests().then(setRequests);
    }
  }, [user?.role]);

  const handleUserSelect = (u: User) => {
    setSelectedUser(u);
    setUserModules(u.enabledModules || []);
  };

  const toggleUserModule = (moduleId: ModuleId) => {
    setUserModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleApproveRequest = async (req: PermissionRequest) => {
    if (!user) return;
    try {
      const targetUser = users.find(u => u.id === req.userId);
      if (targetUser) {
        const newModules = Array.from(new Set([...(targetUser.enabledModules || []), req.moduleId]));
        await api.updateUser(targetUser.id, { enabledModules: newModules });
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, enabledModules: newModules } : u));
      }
      
      await api.updatePermissionRequest(req.id, { 
        status: 'APPROVED',
        processedAt: new Date().toISOString(),
        processedBy: user.id
      });
      
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
      addNotification('Module access granted.', 'success');
    } catch (err) {
      addNotification('Approval failed.', 'error');
    }
  };

  const handleRejectRequest = async (req: PermissionRequest) => {
    if (!user) return;
    try {
      await api.updatePermissionRequest(req.id, { 
        status: 'REJECTED',
        processedAt: new Date().toISOString(),
        processedBy: user.id
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'REJECTED' } : r));
      addNotification('Request rejected.', 'info');
    } catch (err) {
      addNotification('Rejection failed.', 'error');
    }
  };

  const handleSaveUserModules = async () => {
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, { enabledModules: userModules });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, enabledModules: userModules } : u));
      addNotification(`Permissions updated for ${selectedUser.name}`, 'success');
    } catch (err) {
      addNotification('Update failed.', 'error');
    }
  };

  const handleToggle = (key: string, subKey?: string) => {
    const newPrefs = { ...prefs };
    if (subKey) {
      // @ts-ignore
      newPrefs.notifications[subKey] = !newPrefs.notifications[subKey];
    } else {
      // @ts-ignore
      newPrefs[key] = !newPrefs[key];
    }
    setPrefs(newPrefs);
  };

  const toggleModule = (moduleId: ModuleId) => {
    setTenantModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const toggleSecurity = (key: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const updatedUser = await api.updateUser(user.id, { preferences: prefs });
      login(updatedUser, 'mock-token');
      
      if (user.role === 'ADMIN') {
        const tenantData = { 
          enabledModules: tenantModules,
          securitySettings: securitySettings,
          settings: {
            ...currentTenant?.settings,
            primaryColor: brandColor,
            currency: currentTenant?.settings?.currency || 'KES',
            timezone: currentTenant?.settings?.timezone || 'Africa/Nairobi'
          }
        };
        
        if (currentTenant) {
          await api.updateTenant(currentTenant.id, tenantData);
        }
        
        updateTenant(tenantData);
      }
      
      addNotification('Configurations applied.', 'success');
    } catch (err) {
      addNotification('Sync error.', 'error');
    }
  };

  const SettingRow = ({ icon: Icon, title, desc, action }: any) => (
    <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group hover:border-brand-accent transition-all">
       <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
             <Icon size={24} />
          </div>
          <div>
             <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
          </div>
       </div>
       {action}
    </div>
  );

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`} />
    </button>
  );

  // Fix: Added optional children to the props type to satisfy TS compiler in JSX context
  const ContentWrapper = ({ children, title }: { children?: React.ReactNode, title: string }) => {
    if (user?.role === 'DRIVER') return (
      <div className="min-h-screen bg-slate-900 text-white font-sans p-6 pb-20">
        <header className="flex items-center gap-4 mb-8 pt-8">
           <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl"><ChevronLeft size={20}/></button>
           <h1 className="text-xl font-black uppercase tracking-widest">{title}</h1>
        </header>
        {children}
      </div>
    );
    return <Layout title={title}>{children}</Layout>;
  };

  return (
    <ContentWrapper title="Control Center Settings">
       <div className="max-w-4xl mx-auto space-y-12">
          {user?.role === 'ADMIN' && (
            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Organization & SaaS Context</h3>
              <div className="p-8 bg-brand rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[length:40px_40px]"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent shadow-inner">
                      <Building2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">{currentTenant?.name || 'Shipstack Enterprise'}</h4>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Plan: <span className="text-white">{currentTenant?.plan || 'PRO'}</span> &bull; Status: <span className="text-emerald-400">ACTIVE</span></p>
                    </div>
                  </div>
                  <Link 
                    to="/admin/subscription"
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    <CreditCard size={16} /> Manage Billing
                  </Link>
                </div>
              </div>
            </section>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <section className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                  <Zap size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Identity</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="flex flex-col items-center gap-3">
                         <div 
                           className="h-20 w-20 rounded-[2rem] shadow-xl border-4 border-white dark:border-slate-800" 
                           style={{ backgroundColor: brandColor }}
                         />
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Brand</p>
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Terminal Primary Color</p>
                         <div className="flex flex-wrap gap-3">
                            {['#0F2A44', '#1F6AE1', '#1FB6A6', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'].map(color => (
                              <button 
                                key={color}
                                onClick={() => setBrandColor(color)}
                                className={`h-10 w-10 rounded-xl transition-all border-2 ${brandColor === color ? 'border-brand-accent scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            <div className="relative h-10 w-10">
                               <input 
                                 type="color" 
                                 value={brandColor} 
                                 onChange={(e) => setBrandColor(e.target.value)}
                                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                               />
                               <div className="h-full w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
                                  <Plus size={16} />
                               </div>
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">This color will be applied to all tactical interfaces and command pillars.</p>
                      </div>
                   </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                  <LayoutGrid size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modular Architecture</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingRow 
                    icon={RouteIcon} 
                    title="Dispatch Management" 
                    desc="Core trip planning & execution" 
                    action={<Toggle active={tenantModules.includes('dispatch')} onClick={() => toggleModule('dispatch')} />}
                  />
                  <SettingRow 
                    icon={Truck} 
                    title="Fleet Management" 
                    desc="Asset tracking & maintenance" 
                    action={<Toggle active={tenantModules.includes('fleet')} onClick={() => toggleModule('fleet')} />}
                  />
                  <SettingRow 
                    icon={FileText} 
                    title="Commercials & Billing" 
                    desc="Invoicing, rates & payments" 
                    action={<Toggle active={tenantModules.includes('finance')} onClick={() => toggleModule('finance')} />}
                  />
                  <SettingRow 
                    icon={Warehouse} 
                    title="Facility Portal" 
                    desc="Warehouse & hub access" 
                    action={<Toggle active={tenantModules.includes('facility-portal')} onClick={() => toggleModule('facility-portal')} />}
                  />
                  <SettingRow 
                    icon={Users} 
                    title="Client Portal" 
                    desc="External visibility for clients" 
                    action={<Toggle active={tenantModules.includes('client-portal')} onClick={() => toggleModule('client-portal')} />}
                  />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                  <Lock size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Protocols</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingRow 
                    icon={ShieldCheck} 
                    title="Audit Logging" 
                    desc="Traceability for all system actions" 
                    action={<Toggle active={securitySettings.auditLogging} onClick={() => toggleSecurity('auditLogging')} />}
                  />
                  <SettingRow 
                    icon={ShieldCheck} 
                    title="NTSA Verification" 
                    desc="Mandatory asset data validation" 
                    action={<Toggle active={securitySettings.requireNTSAVerification} onClick={() => toggleSecurity('requireNTSAVerification')} />}
                  />
                </div>
              </section>
            </>
          )}

          <section className="space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Connectivity & Performance</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingRow 
                  icon={prefs.theme === 'DARK' ? Moon : Sun} 
                  title="Terminal Theme" 
                  desc={prefs.theme === 'DARK' ? "Dark mode active" : "Light mode active"} 
                  action={<Toggle active={prefs.theme === 'DARK'} onClick={() => setPrefs(prev => ({ ...prev, theme: prev.theme === 'DARK' ? 'LIGHT' : 'DARK' }))} />}
                />
                <SettingRow 
                  icon={RefreshCw} 
                  title="Auto-Sync Stream" 
                  desc="Real-time telemetry uplink" 
                  action={<Toggle active={prefs.autoSync} onClick={() => handleToggle('autoSync')} />}
                />
             </div>
          </section>

          {user?.role === 'ADMIN' && (
            <>
              <section className="space-y-6">
                <div className="flex items-center gap-3 ml-1">
                  <Users size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Module Overrides</h3>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-1/3 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Operator</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleUserSelect(u)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedUser?.id === u.id ? 'bg-brand text-white border-brand' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand/30'}`}
                          >
                            <p className="text-xs font-black uppercase tracking-tight">{u.name}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedUser?.id === u.id ? 'text-white/60' : 'text-slate-400'}`}>{u.role}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedUser ? (
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">Access for {selectedUser.name}</h4>
                          <button 
                            onClick={handleSaveUserModules}
                            className="px-4 py-2 bg-brand text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                          >
                            Save Overrides
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'dispatch', name: 'Dispatch', icon: RouteIcon },
                            { id: 'fleet', name: 'Fleet', icon: Truck },
                            { id: 'finance', name: 'Commercials', icon: FileText },
                            { id: 'warehouse', name: 'Warehouse', icon: Warehouse },
                            { id: 'analytics', name: 'Analytics', icon: Zap },
                            { id: 'integrations', name: 'Integrations', icon: Globe },
                          ].map(m => (
                            <button
                              key={m.id}
                              onClick={() => toggleUserModule(m.id as ModuleId)}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${userModules.includes(m.id as ModuleId) ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                            >
                              <div className="flex items-center gap-3">
                                <m.icon size={16} className={userModules.includes(m.id as ModuleId) ? 'text-emerald-600' : 'text-slate-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${userModules.includes(m.id as ModuleId) ? 'text-emerald-900 dark:text-emerald-400' : 'text-slate-500'}`}>{m.name}</span>
                              </div>
                              <Toggle active={userModules.includes(m.id as ModuleId)} onClick={() => {}} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50">
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Select an operator to manage tactical access</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {requests.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-3 ml-1">
                    <Clock size={16} className="text-slate-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Access Requests</h3>
                  </div>
                  <div className="space-y-3">
                    {requests.filter(r => r.status === 'PENDING').map(req => {
                      const reqUser = users.find(u => u.id === req.userId);
                      return (
                        <div key={req.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center">
                              <Lock size={24} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {reqUser?.name || 'Unknown User'} requests {req.moduleId}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(req.createdAt).toLocaleString()} &bull; {req.reason || 'No reason provided'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleRejectRequest(req)}
                              className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                            >
                              <XCircle size={20} />
                            </button>
                            <button 
                              onClick={() => handleApproveRequest(req)}
                              className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {requests.filter(r => r.status === 'PENDING').length === 0 && (
                      <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem]">
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">No pending access requests</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          <section className="space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Communication Matrix</h3>
             <div className="space-y-3">
                <SettingRow 
                  icon={Bell} 
                  title="Push Notifications" 
                  desc="Immediate mobile status alerts" 
                  action={<Toggle active={prefs.notifications.push} onClick={() => handleToggle('notifications', 'push')} />}
                />
                <SettingRow 
                  icon={Database} 
                  title="Email Digests" 
                  desc="Periodic operational summaries" 
                  action={<Toggle active={prefs.notifications.email} onClick={() => handleToggle('notifications', 'email')} />}
                />
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Terminal Persistence</h3>
             <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <CloudRain className="absolute -right-8 -top-8 text-white/5" size={160} />
                <div className="flex items-center gap-6 mb-8">
                   <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                      <HardDrive size={32} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black uppercase">Local Cache Hub</h4>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Storage used: 14.2 MB</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button 
                    onClick={() => { localStorage.clear(); addNotification('Cache purged.', 'info'); }}
                    className="flex-1 py-4 bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                      <Trash2 size={16} /> Purge Terminal Data
                   </button>
                   <button className="flex-1 py-4 bg-white/5 text-white/40 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                      Sync Local DB
                   </button>
                </div>
             </div>
          </section>

          <div className="flex justify-end pt-10">
             <button 
              onClick={handleSave}
              className="px-12 py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center gap-3"
             >
                <ShieldCheck size={18} /> Apply Terminal Rules
             </button>
          </div>
       </div>
    </ContentWrapper>
  );
};

export default SettingsView;
