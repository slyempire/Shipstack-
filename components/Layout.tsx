
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuthStore, useAppStore, useTenantStore, useModuleStore } from '../store';
import { canAccessRoute } from '../constants/rbac';
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
  UserCheck,
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
  ShoppingCart,
  ChevronRight,
  Briefcase,
  Clock,
  Stethoscope,
  Inbox,
  ShieldAlert,
  Search,
  Navigation,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  Sprout,
  Lightbulb,
  Building2
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import FeatureGuide from './FeatureGuide';
import NotificationCentre from './NotificationCentre';
import { GlobalSearch } from './GlobalSearch';

import { useTenant } from '../hooks/useTenant';
import { getContrastTextColor } from '../utils/color';

import { OnboardingTour } from './OnboardingTour';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, fullWidth = false }) => {
  const { user, logout, currentUserPermissions, currentUserRole } = useAuthStore();
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    notifications, 
    unreadCount,
    moduleClicks,
    trackModuleClick
  } = useAppStore();
  const { theme } = useTenantStore();
  const { tenant, updateTenant } = useTenant();
  const { isModuleActive } = useModuleStore();

  const verticals = [
    { id: 'E-COMMERCE', name: 'E-commerce', icon: ShoppingCart, color: 'text-brand' },
    { id: 'AGRICULTURE', name: 'Agriculture', icon: Sprout, color: 'text-emerald-600' },
    { id: 'HEALTHCARE', name: 'Health & Pharma', icon: Stethoscope, color: 'text-blue-600' },
    { id: 'PHARMA', name: 'Pharmaceuticals', icon: Activity, color: 'text-indigo-600' },
    { id: 'RETAIL', name: 'Retail Hub', icon: ShoppingBag, color: 'text-amber-600' },
    { id: 'CONSTRUCTION', name: 'Heavy Tech', icon: Warehouse, color: 'text-orange-600' }
  ];

  const activeVertical = verticals.find(v => v.id === tenant?.industry) || verticals[0];

  const handleVerticalChange = (id: string) => {
    updateTenant({ industry: id as any });
    setVerticalMenuOpen(false);
  };

  const contrastText = getContrastTextColor(tenant?.settings?.primaryColor || '#0066FF');
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifCentreOpen, setNotifCentreOpen] = useState(false);
  const [verticalMenuOpen, setVerticalMenuOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  
  // Breadcrumbs logic
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getStatusIndicator = () => {
    return (
      <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2 group cursor-help transition-all duration-300 relative">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Active</span>
          <div className="absolute left-full bottom-0 mb-[-4px] ml-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            Real-time tracking enabled
          </div>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-all duration-300 relative">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Environment Secure</span>
          <div className="absolute left-full bottom-0 mb-[-4px] ml-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            ISO-27001 Certified
          </div>
        </div>
      </div>
    );
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);

  // Apply dynamic theme to CSS variables
  useEffect(() => {
    if (theme?.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', theme.primaryColor);
    }
  }, [theme?.primaryColor]);

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
      if (verticalRef.current && !verticalRef.current.contains(event.target as Node)) {
        setVerticalMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Configuration - UPDATED with module mapping and groups
  const navigationConfig = useMemo(() => {
    return [
      {
        group: 'Operations',
        items: [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, id: 'nav-dashboard', moduleId: 'dashboard' },
          { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, id: 'nav-orders', moduleId: 'orders' },
          { name: 'Routing', path: '/admin/dispatch', icon: RouteIcon, id: 'nav-dispatch', moduleId: 'dispatch' },
          { name: 'Manifests', path: '/admin/queue', icon: Clock, id: 'nav-queue', moduleId: 'dispatch' },
          { name: 'Tracking', path: '/admin/tracking', icon: Activity, id: 'nav-tracking', moduleId: 'dispatch' },
          { name: 'Alerts', path: '/admin/exceptions', icon: AlertOctagon, id: 'nav-exceptions', moduleId: 'dispatch' },
          { name: 'Tasks', path: '/admin/tasks', icon: ClipboardList, id: 'nav-tasks', moduleId: 'dashboard' },
          { name: 'Ingress', path: '/admin/ingress', icon: DatabaseZap, id: 'nav-ingress', moduleId: 'integrations' },
        ]
      },
      {
        group: 'Assets',
        items: [
          { name: 'Warehouses', path: '/admin/warehouse', icon: Warehouse, id: 'nav-warehouse', moduleId: 'warehouse' },
          { name: 'Fleet', path: '/admin/fleet', icon: Truck, id: 'nav-fleethub', moduleId: 'fleet' },
        ]
      },
      {
        group: 'Business',
        items: [
          { name: 'Customers', path: '/admin/crm', icon: UserCheck, id: 'nav-crm', moduleId: 'crm' },
          { name: 'Analytics', path: '/admin/analytics', icon: Zap, id: 'nav-intelligence', moduleId: 'analytics' },
          { name: 'Billing', path: '/admin/billing', icon: DollarSign, id: 'nav-finance', moduleId: 'finance' },
        ]
      },
      {
        group: 'Admin',
        items: [
          { name: 'Teams', path: '/admin/users', icon: Users, id: 'nav-teams', moduleId: 'dashboard' },
          { name: 'Recruit', path: '/admin/recruitment', icon: Briefcase, id: 'nav-recruitment', moduleId: 'fleet' },
          { name: 'Marketplace', path: '/admin/marketplace', icon: Layers, id: 'nav-marketplace', roles: ['super_admin', 'tenant_admin'] },
          { name: 'Security', path: '/admin/security', icon: ShieldCheck, id: 'nav-security', roles: ['super_admin', 'tenant_admin'] },
          { name: 'System', path: '/admin/tenants', icon: Building2, id: 'nav-tenants', roles: ['super_admin'] },
        ]
      }
    ];
  }, []);

   const filteredNavigation = useMemo(() => {
    if (!currentUserRole || !tenant) return navigationConfig;
    const role = currentUserRole.toLowerCase();
    const isSuperAdmin = role === 'super_admin';
    const enabledModules = tenant.enabledModules || [];

    return navigationConfig.map(group => {
      // Sort items within group by click count
      const sortedItems = [...group.items].sort((a, b) => {
        const clicksA = a.moduleId ? (moduleClicks[a.moduleId] || 0) : 0;
        const clicksB = b.moduleId ? (moduleClicks[b.moduleId] || 0) : 0;
        return clicksB - clicksA;
      });

      return {
        ...group,
        items: sortedItems.filter(item => {
          // Role check
          if (item.roles && !item.roles.includes(role)) return false;

          // Permission check — same source of truth as the route guards, so
          // the sidebar never shows a link the RoleGuard will then deny.
          if (!canAccessRoute(role as any, item.path)) return false;

          // Marketplace is always visible by default as requested
          if (item.moduleId === 'integrations') return true;

          // Dashboard is always visible
          if (item.moduleId === 'dashboard') return true;

          // CRM module: Superadmins always see it
          if (item.moduleId === 'crm' && isSuperAdmin) return true;

          // Module enablement check
          if (item.moduleId && !enabledModules.includes(item.moduleId as any)) return false;

          return true;
        })
      };
    }).filter(group => group.items.length > 0);
  }, [navigationConfig, currentUserRole, tenant, moduleClicks]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden font-sans transition-colors duration-300 text-gray-900">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-100 transition-all duration-500 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Layers size={18} className="text-white" strokeWidth={3} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight uppercase leading-none text-slate-900">Shipstack</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 mt-4 px-3 space-y-6 overflow-y-auto no-scrollbar pb-32">
          {filteredNavigation.map((group) => (
            <div key={group.group}>
              {!sidebarCollapsed && <p className="px-4 text-[9px] font-black uppercase tracking-widest mb-3 text-slate-300">{group.group}</p>}
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavItem 
                    key={item.path || item.name} 
                    item={item} 
                    collapsed={sidebarCollapsed} 
                    location={location} 
                    onNavigate={(mid: string) => mid && trackModuleClick(mid)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-50 bg-white px-6 lg:px-8 z-[1000]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-900">
              <Menu size={20} />
            </button>
              
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
             <div className="hidden md:block w-full max-w-sm">
                <GlobalSearch />
             </div>

             <div className="flex items-center gap-2">
                 {currentUserRole === 'super_admin' && (
                   <div className="relative" ref={verticalRef}>
                     <button 
                       onClick={() => setVerticalMenuOpen(!verticalMenuOpen)}
                       className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-all"
                     >
                        <activeVertical.icon size={16} />
                     </button>

                     {verticalMenuOpen && (
                       <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl border border-slate-200 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 z-[1100]">
                         <div className="px-4 py-3 border-b border-slate-50 mb-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Industry Pulse</p>
                         </div>
                         {verticals.map((v) => (
                           <button
                             key={v.id}
                             onClick={() => handleVerticalChange(v.id)}
                             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left group ${tenant?.industry === v.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                           >
                             <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${tenant?.industry === v.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md'}`}>
                               <v.icon size={16} />
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${tenant?.industry === v.id ? 'text-slate-900' : 'text-slate-500'}`}>
                               {v.name}
                             </span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 )}

                <button 
                  onClick={() => setNotifCentreOpen(true)}
                  className="h-10 w-10 text-slate-400 hover:text-slate-900 bg-white rounded-2xl transition-all relative group flex items-center justify-center shadow-sm border border-slate-100"
                >
                   <Inbox size={18} className="group-hover:scale-110 transition-transform" />
                   <div className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-red rounded-full border border-white" />
                </button>
                
                <div className="h-6 w-px bg-slate-200 mx-1 lg:mx-2" />

                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 group transition-all"
                  >
                     <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-900 font-black group-hover:border-brand-accent group-hover:shadow-brand-accent/20 transition-all overflow-hidden relative">
                        {user?.avatar ? <img src={user.avatar} className="h-full w-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
                     </div>
                     <ChevronDown size={12} className={`text-slate-300 group-hover:text-slate-900 transition-all duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                   {profileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-[1100]">
                        <div className="px-6 py-8 bg-slate-900 rounded-[2rem] mb-4 text-white overflow-hidden relative">
                          <ShieldCheck size={120} className="absolute -right-8 -bottom-8 opacity-5" />
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 relative z-10">Active Clearance</p>
                          <div className="relative z-10 flex items-center gap-4">
                             <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent">
                                <ShieldCheck size={24} />
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase tracking-tighter leading-none">{currentUserRole?.replace('_', ' ')}</p>
                                <p className="text-[10px] font-medium text-white/50 truncate mt-1">{user?.email}</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-1 px-2">
                          <DropdownItem 
                            icon={UserIcon} 
                            label="My Profile" 
                            desc="Update your personal info" 
                            onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}
                          />
                          <DropdownItem 
                            icon={Settings} 
                            label="Configurations" 
                            desc="Adjust system parameters" 
                            onClick={() => { navigate('/settings'); setProfileMenuOpen(false); }}
                          />
                          <DropdownItem 
                            icon={ShieldAlert} 
                            label="Access Logs" 
                            desc="View security history" 
                            onClick={() => { navigate('/admin/security'); setProfileMenuOpen(false); }}
                          />
                       </div>

                       <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 group hover:bg-red hover:text-white transition-all overflow-hidden relative"
                          >
                             <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Sign Out</span>
                             <LogOut size={16} className="relative z-10" />
                          </button>
                       </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </header>

        
        <main className={`flex-1 overflow-y-auto ${fullWidth ? 'p-0' : 'p-4 md:p-6 lg:p-10'} bg-slate-50 relative transition-colors duration-300`}>
          <div className={`mx-auto ${fullWidth ? 'max-w-none w-full' : 'max-w-[1600px] min-h-full'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className={fullWidth ? 'h-full w-full' : ''}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <NotificationCentre 
        isOpen={notifCentreOpen} 
        onClose={() => setNotifCentreOpen(false)} 
      />

      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      <OnboardingTour />

      <button 
        onClick={() => setGuideOpen(true)}
        className="fixed bottom-8 left-8 h-12 w-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-110 active:scale-95 transition-all group"
      >
        <Lightbulb size={20} className="group-hover:text-yellow-400 transition-colors" />
      </button>
      
      {/* Tactical Quick Action Hub */}
      {currentUserRole !== 'super_admin' && (
        <div className="fixed bottom-10 right-10 z-[2000]">
          <div className="relative">
            {quickActionOpen && (
              <div className="absolute bottom-24 right-0 w-72 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-8 duration-300">
                <div className="px-5 py-4 border-b border-slate-100 mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Initiatives</p>
                </div>
                <div className="space-y-1">
                   {[
                     { icon: Package, label: 'Deploy Shipment', path: '/admin/ingress', perm: 'trips:manage' },
                     { icon: ClipboardList, label: 'Assign Objective', path: '/admin/tasks', perm: 'tasks:manage' },
                     { icon: RouteIcon, label: 'Optimize Route', path: '/admin/dispatch', perm: 'dispatch:manage' },
                     { icon: UserIcon, label: 'Provision Driver', path: '/admin/users', perm: 'users:manage' }
                   ].filter(a => !a.perm || (currentUserPermissions as any).includes(a.perm)).map((action, i) => (
                     <QuickActionItem 
                       key={i}
                       icon={action.icon} 
                       label={action.label} 
                       onClick={() => { navigate(action.path); setQuickActionOpen(false); }} 
                     />
                   ))}
                </div>
              </div>
            )}
            <button 
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="h-16 w-16 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-brand/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              {quickActionOpen ? <X size={24} className="relative z-10" /> : <Plus size={24} className="relative z-10" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ item, collapsed, location, onNavigate }: any) => {
  const Icon = item.icon as any;
  const navigate = useNavigate();
  const isActive = location.pathname === item.path;

  const handleNav = (e: React.MouseEvent) => {
    if (onNavigate) onNavigate(item.moduleId);
  };

  const navItemClasses = `flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-xs font-bold uppercase tracking-tight group relative ${isActive ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50/50'}`;

  return (
    <Link to={item.path!} className="block" id={item.id} onClick={handleNav}>
      <div className={navItemClasses}>
        {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-slate-900 rounded-r" />}
        <div className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {!collapsed && <span className="flex-1 text-left truncate">{item.name}</span>}
        
        {collapsed && (
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
            {item.name}
          </div>
        )}
      </div>
    </Link>
  );
};

const QuickActionItem = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-slate-50 transition-all text-left group"
  >
    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
      <Icon size={18} />
    </div>
    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const DropdownItem = ({ icon: Icon, label, desc, onClick, highlight }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all hover:bg-slate-50 group ${highlight ? 'bg-blue-50' : ''}`}
  >
     <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-lg transition-all">
        <Icon size={16} />
     </div>
     <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{label}</p>
        <p className="text-[8px] font-bold text-slate-400 truncate leading-none uppercase tracking-widest">{desc}</p>
     </div>
  </button>
);

export default Layout;
