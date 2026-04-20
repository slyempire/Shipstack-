
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuthStore, useAppStore, useTenantStore, useModuleStore } from '../store';
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
  Archive,
  MoreHorizontal,
  Pin,
  Flame,
  Sprout,
  Stethoscope,
  ShoppingCart,
  ChevronRight,
  ShieldAlert,
  Inbox,
  Lightbulb
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import FeatureGuide from './FeatureGuide';
import NotificationCentre from './NotificationCentre';

import { useTenant } from '../hooks/useTenant';
import { getContrastTextColor } from '../utils/color';

import { OnboardingTour } from './OnboardingTour';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout, currentUserPermissions, currentUserRole } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, notifications, unreadCount } = useAppStore();
  const { theme } = useTenantStore();
  const { tenant, updateTenant } = useTenant();
  const { isModuleActive } = useModuleStore();

  const verticals = [
    { id: 'E-COMMERCE', name: 'E-commerce', icon: Package, color: 'text-brand' },
    { id: 'FOOD', name: 'Agriculture', icon: Sprout, color: 'text-emerald-600' },
    { id: 'MEDICAL', name: 'Healthcare', icon: Stethoscope, color: 'text-blue-600' },
    { id: 'RETAIL', name: 'Retail', icon: ShoppingCart, color: 'text-amber-600' }
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational</span>
          <div className="absolute left-full bottom-0 mb-[-4px] ml-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            AI-assisted insights active
          </div>
        </div>
        <div className="flex items-center gap-2 group cursor-help transition-all duration-300 relative">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cluster v4.2</span>
          <div className="absolute left-full bottom-0 mb-[-4px] ml-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            ISO-27001 Certified Environment
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

  // Navigation Configuration - UPDATED with ALL requested sections
  const navigationConfig = useMemo(() => {
    const sections = [
      {
        group: 'Core Engine',
        items: [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Trips', path: '/admin/trips', icon: Truck },
          { name: 'Dispatch', path: '/admin/dispatch', icon: RouteIcon },
          { name: 'Fleet', path: '/admin/fleet', icon: Warehouse },
          { name: 'Live Tracking', path: '/admin/tracking', icon: MapIcon },
        ]
      },
      { 
        group: 'Fulfillment', 
        items: [
          { name: 'Warehouse', path: '/admin/warehouse', icon: Package },
          { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
          { name: 'Exceptions', path: '/admin/exceptions', icon: AlertOctagon },
          { name: 'DN Queue', path: '/admin/queue', icon: Inbox },
        ]
      },
      {
        group: 'Commercial',
        items: [
          { name: 'Invoicing', path: '/admin/billing', icon: FileText },
          { name: 'Rate Profiles', path: '/admin/rates', icon: Scale },
          { name: 'CRM', path: '/admin/crm', icon: Users },
        ]
      },
      {
        group: 'People',
        items: [
          { name: 'Users', path: '/admin/users', icon: Users },
          { name: 'Recruitment', path: '/admin/recruitment', icon: Users },
        ]
      },
      {
        group: 'Insights',
        items: [
          { name: 'Analytics', path: '/admin/analytics', icon: Activity },
          { name: 'Data Ingress', path: '/admin/ingress', icon: DatabaseZap },
          { name: 'Security Audit', path: '/admin/security', icon: ShieldCheck },
        ]
      },
      {
        group: 'Platform',
        items: [
          { name: 'Marketplace', path: '/admin/marketplace', icon: Layers },
          { name: 'Subscription', path: '/admin/subscription', icon: DollarSign },
          { name: 'Settings', path: '/settings', icon: Settings },
        ]
      }
    ];

    return sections;
  }, []);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden font-sans transition-colors duration-300 text-gray-900">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-24' : 'w-72'} bg-slate-900 border-r border-slate-800 transition-all duration-500 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl`}>
        <div className="flex h-20 items-center justify-between px-8 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 shrink-0 transform group-hover:rotate-6 transition-all duration-300">
              <Layers size={22} className="text-slate-900" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
                <span className="text-xl font-black tracking-tighter uppercase font-display leading-none text-white">Shipstack</span>
                <span className="text-[8px] font-black text-brand uppercase tracking-[0.3em] mt-1 opacity-60">Fleet Intelligence</span>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-300">
            <Menu size={18} />
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-8 overflow-y-auto no-scrollbar pb-32">
          {/* Sectioned Navigation */}
          {navigationConfig.map((group) => (
            <div key={group.group}>
              {!sidebarCollapsed && <p className="px-5 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-500 italic">{group.group}</p>}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    collapsed={sidebarCollapsed} 
                    contrastText={contrastText} 
                    location={location} 
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        {!sidebarCollapsed && (
          <div className="flex-shrink-0 p-6 space-y-2 bg-slate-900 border-t border-slate-800">
            {getStatusIndicator()}
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 z-[1000] shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-[#2563eb] transition-colors"><Menu size={24} /></button>
              
            {/* Extended Header with Breadcrumbs */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                 <Link to="/admin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors">Shipstack</Link>
                 {pathnames.map((name, index) => {
                   const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                   const isLast = index === pathnames.length - 1;
                   return (
                     <React.Fragment key={name}>
                        <ChevronRight size={10} className="text-slate-300" />
                        <Link 
                          to={routeTo} 
                          className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isLast ? 'text-slate-900 pointer-events-none' : 'text-slate-400 hover:text-brand'}`}
                        >
                           {name.replace(/-/g, ' ')}
                        </Link>
                     </React.Fragment>
                   );
                 })}
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              {/* Vertical Switcher */}
              <div className="relative mr-2" ref={verticalRef}>
                <button 
                  onClick={() => setVerticalMenuOpen(!verticalMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg transition-all font-black text-[10px] uppercase tracking-widest text-slate-700"
                >
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center bg-white shadow-sm font-bold ${activeVertical.color}`}>
                     <activeVertical.icon size={14} />
                  </div>
                  <span className="hidden md:inline italic">{activeVertical.name}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${verticalMenuOpen ? 'rotate-180' : ''}`} />
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

             <button 
                onClick={() => setNotifCentreOpen(true)}
                className="h-10 w-10 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all relative group flex items-center justify-center"
              >
                 <Inbox size={20} className="group-hover:scale-110 transition-transform" />
                 {unreadCount > 0 && (
                   <div className="absolute top-0 right-0 h-4 w-4 bg-red rounded-full border-2 border-white flex items-center justify-center shadow-lg transform -translate-y-1 translate-x-1">
                      <span className="text-[8px] font-black text-white">{unreadCount}</span>
                   </div>
                 )}
              </button>
              
             <div className="h-6 w-px bg-slate-200 mx-2" />

             <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 pl-2 group transition-all"
                >
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black leading-none mb-1 group-hover:text-brand transition-colors uppercase tracking-tight truncate max-w-[150px]">{user?.name}</p>
                      <div className="flex items-center justify-end gap-1.5">
                         <ShieldCheck size={10} className="text-emerald-500" />
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{currentUserRole}</p>
                      </div>
                   </div>
                   <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 font-black group-hover:border-brand group-hover:shadow-brand/20 transition-all overflow-hidden relative">
                      {user?.avatar ? <img src={user.avatar} className="h-full w-full object-cover" /> : <UserIcon size={20} className="text-slate-300" />}
                      <div className="absolute bottom-1 right-1 h-2 w-2 bg-emerald-500 rounded-full border-2 border-white" />
                   </div>
                   <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
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
                          label="Profile Console" 
                          desc="Personal identity hub" 
                          onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}
                        />
                        <DropdownItem 
                          icon={Settings} 
                          label="Architecture" 
                          desc="System-level configuration" 
                          onClick={() => { navigate('/settings'); setProfileMenuOpen(false); }}
                        />
                        <DropdownItem 
                          icon={ShieldAlert} 
                          label="Security Audit" 
                          desc="Governance trail" 
                          onClick={() => { navigate('/admin/security'); setProfileMenuOpen(false); }}
                        />
                     </div>

                     <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 group hover:bg-red hover:text-white transition-all overflow-hidden relative"
                        >
                           <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Decommission Session</span>
                           <LogOut size={16} className="relative z-10" />
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 bg-slate-50 relative transition-colors duration-300">
          <div className="mx-auto max-w-[1600px] min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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

const NavItem = ({ item, collapsed, contrastText, location, onPin, pinned }: any) => {
  const Icon = item.icon as any;
  const isActive = location.pathname === item.path || item.subPaths?.some((p: string) => location.pathname.startsWith(p));
  
  return (
    <div className="group/nav flex items-center gap-1">
      <Link 
        to={item.path!} 
        id={`nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
        className={`flex-1 flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] transition-all duration-300 text-[11px] font-black uppercase tracking-widest group relative overflow-hidden ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
      >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />}
        <div className={`shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover/nav:scale-110 group-hover/nav:text-emerald-400'}`}>
          <Icon size={18} strokeWidth={ isActive ? 2.5 : 2 } />
        </div>
        {!collapsed && <span className="truncate italic">{item.name}</span>}
        
        {item.badge && !collapsed && (
          <span className={`ml-auto px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {item.badge}
          </span>
        )}

        {collapsed && (
          <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 whitespace-nowrap shadow-2xl">
            {item.name}
          </div>
        )}
      </Link>
    </div>
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
    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-left transition-all hover:bg-slate-50 group ${highlight ? 'bg-blue-50' : ''}`}
  >
     <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-xl transition-all">
        <Icon size={20} />
     </div>
     <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{label}</p>
        <p className="text-[10px] font-medium text-slate-400 truncate leading-none uppercase tracking-widest">{desc}</p>
     </div>
  </button>
);

export default Layout;
