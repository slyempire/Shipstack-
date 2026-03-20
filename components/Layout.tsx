
import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore, useAppStore, useTenantStore } from '../store';
import { api } from '../api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Map as MapIcon, 
  FileText, 
  Package, 
  LogOut, 
  Menu, 
  X,
  Settings,
  DollarSign,
  User as UserIcon,
  AlertOctagon,
  Users,
  Warehouse,
  Route as RouteIcon,
  Scale,
  Layers,
  ChevronDown,
  ShieldCheck,
  Bell,
  DatabaseZap,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Zap,
  ShoppingBag,
  Activity,
  Archive
} from 'lucide-react';

import FeatureGuide from './FeatureGuide';

import { useTenant } from '../hooks/useTenant';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, notifications, markAsRead, clearAllNotifications } = useAppStore();
  const { theme } = useTenantStore();
  const { isModuleEnabled, tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Apply dynamic theme to CSS variables
  useEffect(() => {
    if (theme.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', theme.primaryColor);
    }
  }, [theme.primaryColor]);

  const handleLogout = async () => { 
    setProfileMenuOpen(false);
    try {
      await api.logout();
    } catch (err) {
      console.error('Firebase logout failed', err);
    }
    logout(); 
    navigate('/login'); 
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (user?.role === 'DRIVER') return <div className="h-full bg-slate-50 overflow-y-auto">{children}</div>;

  // New Grouped Menu Structure
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['ADMIN', 'DISPATCHER', 'FINANCE'] },
    { 
      name: 'Operations Hub', 
      path: '/admin/queue', 
      icon: Package, 
      roles: ['ADMIN', 'DISPATCHER'],
      module: 'dispatch'
    },
    { 
      name: 'Order Management', 
      path: '/admin/orders', 
      icon: ShoppingBag, 
      roles: ['ADMIN', 'DISPATCHER'],
      module: 'orders',
      industries: ['MEDICAL', 'FOOD', 'GENERAL', 'MANUFACTURING']
    },
    { 
      name: 'Warehouse Management', 
      path: '/admin/warehouse', 
      icon: Archive, 
      roles: ['ADMIN', 'DISPATCHER'],
      module: 'warehouse',
      industries: ['MEDICAL', 'FOOD', 'MANUFACTURING']
    },
    { 
      name: 'Dispatch Workspace', 
      path: '/admin/dispatch', 
      icon: RouteIcon, 
      roles: ['ADMIN', 'DISPATCHER'],
      module: 'dispatch'
    },
    { 
      name: 'Data Ingress', 
      path: '/admin/ingress', 
      icon: DatabaseZap, 
      roles: ['ADMIN', 'DISPATCHER'],
      module: 'dispatch'
    },
    { name: 'Live Tracking', path: '/admin/tracking', icon: MapIcon, roles: ['ADMIN', 'DISPATCHER'], module: 'dispatch' },
    { name: 'Exceptions', path: '/admin/exceptions', icon: AlertOctagon, roles: ['ADMIN', 'DISPATCHER'], module: 'dispatch' },
    { 
      name: 'Fleet & Network', 
      path: '/admin/fleet', 
      icon: Warehouse, 
      roles: ['ADMIN', 'DISPATCHER'],
      subPaths: ['/admin/users', '/admin/security'],
      module: 'fleet'
    },
    { 
      name: 'Commercial Hub', 
      path: '/admin/billing', 
      icon: FileText, 
      roles: ['ADMIN', 'FINANCE'],
      subPaths: ['/admin/rates'],
      module: 'finance'
    },
    { 
      name: 'Analytics', 
      path: '/admin/analytics', 
      icon: Activity, 
      roles: ['ADMIN'],
      module: 'analytics'
    },
  ];

  const filteredMenu = menuItems.filter(item => {
    const hasRole = user && item.roles?.includes(user.role as any);
    const isEnabled = !item.module || isModuleEnabled(item.module as any);
    const isIndustryRelevant = !item.industries || (tenant?.industry && item.industries.includes(tenant.industry));
    return hasRole && isEnabled && isIndustryRelevant;
  });

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand text-white transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-accent flex items-center justify-center shadow-lg">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tight uppercase font-display">Shipstack</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto no-scrollbar pb-24">
          <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Command Pillars</p>
          {filteredMenu.map((item) => {
            const Icon = item.icon as any;
            const isActive = location.pathname === item.path || item.subPaths?.some(p => location.pathname.startsWith(p));
            
            return (
              <Link 
                key={item.path} 
                to={item.path!} 
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest ${isActive ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} strokeWidth={ isActive ? 2.5 : 2 } />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-accent" />}
              </Link>
            );
          })}

          <div className="pt-8 px-4">
            <button 
              onClick={() => setGuideOpen(true)}
              className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40 group-hover:text-brand-accent group-hover:bg-white transition-all">
                <ShieldCheck size={16} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Platform Guide</p>
                <p className="text-[8px] font-bold text-white/20 uppercase leading-none">Learn the pillars</p>
              </div>
            </button>
          </div>
        </nav>
        
        <div className="absolute bottom-6 left-4 right-4 p-5 bg-white/5 rounded-2xl border border-white/5">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">KE-NBO Cluster Active</span>
           </div>
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Stack Version 4.2.0-STABLE</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b dark:border-slate-800 bg-white dark:bg-slate-900 px-6 z-[1000] shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-brand-accent transition-colors"><Menu size={24} /></button>
            <h1 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="p-2 text-slate-400 hover:text-brand transition-colors relative"
                >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <div className="absolute top-2 right-2 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">{unreadCount}</span>
                     </div>
                   )}
                </button>

                {notifMenuOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-[1100]">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Notifications</h4>
                      <button onClick={clearAllNotifications} className="text-[9px] font-black uppercase text-slate-400 hover:text-brand">Clear All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={24} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                          <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No new alerts</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.read ? 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 shadow-sm'}`}
                          >
                            <div className="flex gap-3">
                              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-500' : n.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                                {n.type === 'success' && <CheckCircle size={14} />}
                                {n.type === 'error' && <AlertCircle size={14} />}
                                {n.type === 'info' && <Info size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[11px] leading-tight ${n.read ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-white font-black'}`}>{n.message}</p>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>
             
             <div className="h-6 w-px bg-slate-100 mx-2" />

             {/* Integrated Profile & System Action Hub */}
             <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 pl-2 group transition-all"
                >
                   <div className="text-right hidden sm:block">
                      <p className="text-[11px] font-black text-slate-900 leading-none mb-1 group-hover:text-brand-accent transition-colors uppercase tracking-tight">{user?.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</p>
                   </div>
                   <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-brand font-black group-hover:bg-brand-accent group-hover:text-white transition-all border border-slate-100 shadow-sm overflow-hidden">
                      {user?.avatar ? <img src={user.avatar} className="h-full w-full object-cover" /> : user?.name.charAt(0)}
                   </div>
                   <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Tactical Action Dropdown */}
                 {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-[0_30px_100px_rgba(0,0,0,0.15)] p-3 animate-in fade-in zoom-in-95 duration-200 z-[1100]">
                     <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated ID</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{user?.email}</p>
                     </div>
                     
                     <div className="space-y-1">
                        <DropdownItem 
                          icon={UserIcon} 
                          label="Identity Profile" 
                          desc="Manage security credentials" 
                          onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}
                        />
                        <DropdownItem 
                          icon={Settings} 
                          label="System Settings" 
                          desc="Terminal & sync configuration" 
                          onClick={() => { navigate('/settings'); setProfileMenuOpen(false); }}
                        />
                        <DropdownItem 
                          icon={Scale} 
                          label="Governance" 
                          desc="Legal & Charter of Ops" 
                          onClick={() => { navigate('/legal'); setProfileMenuOpen(false); }}
                        />
                        {user?.role === 'ADMIN' && (
                          <>
                            <DropdownItem 
                              icon={Users} 
                              label="User Management" 
                              desc="Global access control" 
                              onClick={() => { navigate('/admin/users'); setProfileMenuOpen(false); }}
                              highlight
                            />
                            <DropdownItem 
                              icon={ShieldCheck} 
                              label="Security & ISO" 
                              desc="Compliance & Audit" 
                              onClick={() => { navigate('/admin/security'); setProfileMenuOpen(false); }}
                              highlight
                            />
                          </>
                        )}
                     </div>

                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group hover:bg-red-500 hover:text-white transition-all"
                        >
                           <span className="text-[11px] font-black uppercase tracking-widest">End Active Session</span>
                           <LogOut size={16} />
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
          <div className="mx-auto max-w-[1400px] min-h-full">
            {children}
          </div>
        </main>
      </div>
      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      
      {/* Tactical Quick Action Hub */}
      {user?.role !== 'CLIENT' && (
        <div className="fixed bottom-8 right-8 z-[2000]">
          <div className="relative">
            {quickActionOpen && (
              <div className="absolute bottom-20 right-0 w-64 bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="px-4 py-3 border-b border-slate-100 mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Actions</p>
                </div>
                <div className="space-y-1">
                   {user?.role === 'ADMIN' || user?.role === 'DISPATCHER' ? (
                     <>
                       <QuickActionItem icon={Package} label="New Shipment" onClick={() => { navigate('/admin/ingress'); setQuickActionOpen(false); }} />
                       <QuickActionItem icon={RouteIcon} label="Plan Trip" onClick={() => { navigate('/admin/dispatch'); setQuickActionOpen(false); }} />
                       <QuickActionItem icon={Users} label="Add Driver" onClick={() => { navigate('/admin/users'); setQuickActionOpen(false); }} />
                     </>
                   ) : user?.role === 'FINANCE' ? (
                     <>
                       <QuickActionItem icon={FileText} label="Generate Invoice" onClick={() => { navigate('/admin/billing'); setQuickActionOpen(false); }} />
                       <QuickActionItem icon={Scale} label="Reconcile Payouts" onClick={() => { navigate('/admin/billing'); setQuickActionOpen(false); }} />
                     </>
                   ) : null}
                </div>
              </div>
            )}
            <button 
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="h-16 w-16 rounded-full bg-brand text-white shadow-2xl shadow-brand/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {quickActionOpen ? <X size={24} /> : <Zap size={24} className="group-hover:animate-pulse" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickActionItem = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group"
  >
    <div className="h-9 w-9 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all">
      <Icon size={16} />
    </div>
    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{label}</span>
  </button>
);

const DropdownItem = ({ icon: Icon, label, desc, onClick, highlight }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group ${highlight ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
  >
     <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${highlight ? 'bg-white dark:bg-slate-800 text-brand shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-brand group-hover:shadow-sm'}`}>
        <Icon size={18} />
     </div>
     <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate leading-none">{desc}</p>
     </div>
  </button>
);

export default Layout;
