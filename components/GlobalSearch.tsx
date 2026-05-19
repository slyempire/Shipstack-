
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Command, 
  ChevronRight, 
  Package, 
  Truck, 
  Users, 
  ShoppingBag, 
  Box, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useModuleStore, useTenantStore, useAppStore } from '../store';
import { api } from '../api';
import { Permission } from '../types';
import { Badge } from '../packages/ui/Badge';

interface SearchResult {
  id: string;
  type: 'module' | 'feature' | 'order' | 'shipment' | 'vehicle' | 'user' | 'inventory';
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
  metadata?: any;
}

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { currentUserRole, hasPermission } = useAuthStore();
  const { isModuleActive } = useModuleStore();
  const { currentTenant } = useTenantStore();

  // Navigation items to search through
  const navItems = [
    { name: 'Dashboard', path: '/admin', id: 'dashboard', icon: Layers, moduleId: 'dashboard' },
    { name: 'Orders', path: '/admin/orders', id: 'orders', icon: ShoppingBag, moduleId: 'orders' },
    { name: 'Routing', path: '/admin/dispatch', id: 'dispatch', icon: Truck, moduleId: 'dispatch' },
    { name: 'Inventory', path: '/admin/warehouse', id: 'warehouse', icon: Box, moduleId: 'warehouse' },
    { name: 'Fleet', path: '/admin/fleet', id: 'fleet', icon: Truck, moduleId: 'fleet' },
    { name: 'CRM', path: '/admin/crm', id: 'crm', icon: Users, moduleId: 'crm' },
    { name: 'Analytics', path: '/admin/analytics', id: 'analytics', icon: Database, moduleId: 'analytics' },
    { name: 'Billing', path: '/admin/billing', id: 'finance', icon: Package, moduleId: 'finance' },
    { name: 'Marketplace', path: '/admin/marketplace', id: 'marketplace', icon: Layers, moduleId: 'integrations' },
    { name: 'Security', path: '/admin/security', id: 'security', icon: Layers, moduleId: 'dashboard' },
    { name: 'Teams', path: '/admin/users', id: 'users', icon: Users, moduleId: 'dashboard' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // 1. Search Modules (Client Side)
        const matchedModules = navItems.filter(item => {
          const matches = item.name.toLowerCase().includes(query.toLowerCase());
          const isActive = item.moduleId ? isModuleActive(item.moduleId) : true;
          
          // Enhanced RBAC: verify if user has permission to see this target
          let canView = true;
          if (currentUserRole !== 'super_admin' && item.moduleId) {
            const modulePermissions: Record<string, string[]> = {
              'orders': ['orders:view', 'orders:manage'],
              'dispatch': ['dispatch:view', 'dispatch:manage'],
              'warehouse': ['warehouse:view', 'warehouse:manage'],
              'fleet': ['fleet:view', 'fleet:manage'],
              'finance': ['finance:view', 'finance:manage'],
              'analytics': ['analytics:view'],
              'crm': ['crm:view']
            };
            
            const requiredPlat = modulePermissions[item.moduleId];
            if (requiredPlat && Array.isArray(requiredPlat)) {
              canView = requiredPlat.some(p => hasPermission(p as Permission));
            }
          }

          return matches && isActive && canView;
        });

        matchedModules.forEach(m => {
          searchResults.push({
            id: m.id,
            type: 'module',
            title: m.name,
            subtitle: 'System Module',
            path: m.path,
            icon: m.icon
          });
        });

        // 3. Search Data
        const canSearchOrders = currentUserRole === 'super_admin' || hasPermission('orders:view');
        const canSearchShipments = currentUserRole === 'super_admin' || hasPermission('trips:view');
        const canSearchVehicles = currentUserRole === 'super_admin' || hasPermission('fleet:view');
        const canSearchUsers = currentUserRole === 'super_admin' || hasPermission('users:manage');
        const canSearchWarehouse = currentUserRole === 'super_admin' || hasPermission('warehouse:view');
        const canSearchCustomers = currentUserRole === 'super_admin' || hasPermission('crm:view');

        const [orders, dns, vehicles, users, inventory, facilities, tasks, customers] = await Promise.all([
          canSearchOrders ? api.getOrders() : Promise.resolve([]),
          canSearchShipments ? api.getDeliveryNotes() : Promise.resolve([]),
          canSearchVehicles ? api.getVehicles() : Promise.resolve([]),
          canSearchUsers ? api.getUsers(currentTenant?.id) : Promise.resolve([]),
          canSearchWarehouse ? api.getInventory() : Promise.resolve([]),
          canSearchWarehouse ? api.getFacilities() : Promise.resolve([]),
          api.getTasks(),
          canSearchCustomers ? api.getCustomers(currentTenant?.id) : Promise.resolve([])
        ]);

        const lowerQuery = query.toLowerCase();

        // Orders
        if (canSearchOrders) {
          orders.filter(o => o.externalId.toLowerCase().includes(lowerQuery) || o.customerName.toLowerCase().includes(lowerQuery))
                .slice(0, 3).forEach(o => searchResults.push({ id: o.id, type: 'order', title: o.externalId, subtitle: `Order • ${o.customerName} • ${o.status}`, path: `/admin/orders?id=${o.id}`, icon: ShoppingBag }));
        }

        // Shipments
        if (canSearchShipments) {
          dns.filter(d => d.externalId.toLowerCase().includes(lowerQuery) || d.clientName.toLowerCase().includes(lowerQuery))
             .slice(0, 3).forEach(d => searchResults.push({ id: d.id, type: 'shipment', title: d.externalId, subtitle: `Shipment • ${d.clientName} • ${d.status}`, path: `/admin/queue?id=${d.id}`, icon: Package }));
        }

        // Vehicles
        if (canSearchVehicles) {
          vehicles.filter(v => v.plate.toLowerCase().includes(lowerQuery) || v.ownerId.toLowerCase().includes(lowerQuery))
                  .slice(0, 3).forEach(v => searchResults.push({ id: v.id, type: 'vehicle', title: v.plate, subtitle: `Vehicle • ${v.type} • ${v.ownerId}`, path: `/admin/fleet?id=${v.id}`, icon: Truck }));
        }

        // Users
        if (canSearchUsers) {
          users.filter(u => u.name.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
               .slice(0, 2).forEach(u => searchResults.push({ id: u.id, type: 'user', title: u.name, subtitle: `User • ${u.role} • ${u.email}`, path: `/admin/users?id=${u.id}`, icon: Users }));
        }

        // Customers
        if (canSearchCustomers) {
          customers.filter(c => c.name.toLowerCase().includes(lowerQuery) || c.email.toLowerCase().includes(lowerQuery))
                   .slice(0, 3).forEach(c => searchResults.push({ id: c.id, type: 'user', title: c.name, subtitle: `Customer • ${c.address} • ${c.phone}`, path: `/admin/crm?id=${c.id}`, icon: Users }));
        }

        // Inventory & Facilities
        if (canSearchWarehouse) {
          inventory.filter(i => i.sku.toLowerCase().includes(lowerQuery) || i.name.toLowerCase().includes(lowerQuery))
                   .slice(0, 2).forEach(i => searchResults.push({ id: i.id, type: 'inventory', title: i.sku, subtitle: `Inventory • ${i.name}`, path: `/admin/warehouse?sku=${i.sku}`, icon: Box }));
          facilities.filter(f => f.name.toLowerCase().includes(lowerQuery))
                    .slice(0, 2).forEach(f => searchResults.push({ id: f.id, type: 'module', title: f.name, subtitle: `Facility • ${f.type}`, path: `/admin/warehouse?f=${f.id}`, icon: Box }));
        }

        // Tasks
        tasks.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.description?.toLowerCase().includes(lowerQuery))
             .slice(0, 3).forEach(t => searchResults.push({ id: t.id, type: 'feature', title: t.title, subtitle: `Task • ${t.status} • Assigned: ${t.assignedTo || 'Unassigned'}`, path: `/admin/tasks?id=${t.id}`, icon: Layers }));

        setResults(searchResults);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [query, isModuleActive, currentTenant?.id]);

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all text-slate-400 group min-w-[280px]"
      >
        <Search size={18} className="group-hover:text-brand transition-colors" />
        <span className="text-[11px] font-black uppercase tracking-widest">Search Console...</span>
        <div className="ml-auto flex items-center gap-1 opacity-40">
          <Command size={10} />
          <span className="text-[9px] font-black">K</span>
        </div>
      </button>

      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden h-10 w-10 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400"
      >
        <Search size={20} />
      </button>

      {/* Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[2001] overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <Search size={24} className="text-brand" />
                <input 
                  autoFocus
                  placeholder="Query Shipstack Core... (Modules, Shipments, Fleet)"
                  className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="h-8 w-8 rounded-xl bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-300/50 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
                {isLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="h-10 w-10 border-4 border-slate-200 border-t-brand rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Scanning Neural Mesh...</span>
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-center">
                    <Package size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-tight">No results found for "{query}"</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Adjust your query or check module access</p>
                  </div>
                ) : !query ? (
                  <div className="p-8">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-4">Fast Access</p>
                     <div className="grid grid-cols-2 gap-2">
                        {navItems.slice(0, 6).map(item => (
                          <button 
                            key={item.id}
                            onClick={() => handleResultClick(item.path)}
                            className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all text-left group"
                          >
                            <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <item.icon size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Jump to Module</p>
                            </div>
                          </button>
                        ))}
                     </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-1">
                    {/* Results grouped by type could be nice, but flat list with meta is cleaner for this style */}
                    {results.map((result) => (
                      <button 
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.path)}
                        className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all text-left group"
                      >
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                          <result.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{result.title}</span>
                              <Badge variant={result.type === 'module' ? 'delivered' : 'pending'}>
                                {result.type}
                              </Badge>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{result.subtitle}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                          <ChevronRight size={18} className="text-brand" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900 text-slate-500 border-t border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-slate-400">ESC</kbd>
                       <span className="text-[9px] font-black uppercase tracking-widest">to close</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <ArrowRight size={10} className="rotate-90" />
                       <span className="text-[9px] font-black uppercase tracking-widest">to navigate</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-brand">
                    <div className="h-1 w-1 rounded-full bg-brand animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent">Direct Hub Persistence</span>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
