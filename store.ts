
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  SystemRole,
  Permission,
  Tenant,
  Notification,
  AuditLogEntry,
  TenantModule,
  ModuleDefinition
} from './types';
import { hasPermission as checkPermission, ROLE_DEFINITIONS } from './constants/rbac';
import { CORE_MODULES, getModuleById, checkModuleDependencies, checkModuleConflicts } from './constants/modules';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentUserRole: SystemRole;
  currentUserPermissions: Permission[];
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setUserRole: (role: SystemRole) => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    currentUserRole: 'client',
    currentUserPermissions: [],
    login: (user, token) => {
      if (!user || !token) {
        console.error('[Auth] login() called without user or token — rejected');
        return;
      }
      const userWithPrefs = {
        ...user,
        preferences: {
          theme: 'LIGHT',
          ...user.preferences
        }
      };
      const role = (user.role as SystemRole) || 'client';
      set({
        user: userWithPrefs,
        token,
        isAuthenticated: true,
        currentUserRole: role,
        currentUserPermissions: ROLE_DEFINITIONS[role]?.permissions || []
      });
    },
    logout: () => set({ user: null, token: null, isAuthenticated: false, currentUserRole: 'client', currentUserPermissions: [] }),
    updateUser: (data) => set((state) => {
      const updatedUser = state.user ? { ...state.user, ...data } : null;
      return { user: updatedUser };
    }),
    setUserRole: (role) => set({
      currentUserRole: role,
      currentUserPermissions: ROLE_DEFINITIONS[role]?.permissions || []
    }),
    hasPermission: (permission) => {
      const { currentUserRole } = get();
      return checkPermission(currentUserRole, permission);
    }
  })
);

interface ModuleState {
  installedModules: TenantModule[];
  pendingInstalls: string[];
  installModule: (moduleId: string) => Promise<void>;
  uninstallModule: (moduleId: string) => Promise<void>;
  updateModuleConfig: (moduleId: string, config: Record<string, unknown>) => void;
  isModuleInstalled: (moduleId: string) => boolean;
  isModuleActive: (moduleId: string) => boolean;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      installedModules: CORE_MODULES.map(m => ({
        id: `core-${m.id}`,
        tenantId: 'current',
        moduleId: m.id,
        status: 'active',
        installedVersion: m.version,
        installedAt: new Date().toISOString(),
        installedBy: 'system',
        lastUpdatedAt: new Date().toISOString()
      })),
      pendingInstalls: [],
      installModule: async (moduleId) => {
        const { installedModules } = get();
        const module = getModuleById(moduleId);
        if (!module) throw new Error('Module not found');

        // Circular dependency check (simplified)
        const installedIds = installedModules.map(m => m.moduleId);
        const { canInstall, missing } = checkModuleDependencies(moduleId, installedIds);
        if (!canInstall) throw new Error(`Missing dependencies: ${missing.join(', ')}`);

        const { hasConflict, conflicting } = checkModuleConflicts(moduleId, installedIds);
        if (hasConflict) throw new Error(`Conflicting modules: ${conflicting.join(', ')}`);

        set(state => ({ pendingInstalls: [...state.pendingInstalls, moduleId] }));

        const newModule: TenantModule = {
          id: `${Date.now()}`,
          tenantId: 'current',
          moduleId: module.id,
          status: 'active',
          installedVersion: module.version,
          installedAt: new Date().toISOString(),
          installedBy: 'user',
          lastUpdatedAt: new Date().toISOString()
        };

        set(state => ({
          installedModules: [...state.installedModules, newModule],
          pendingInstalls: state.pendingInstalls.filter(id => id !== moduleId)
        }));

        useAuditStore.getState().logAction('install_module', 'module', module.id, { name: module.name });
      },
      uninstallModule: async (moduleId) => {
        set(state => ({
          installedModules: state.installedModules.filter(m => m.moduleId !== moduleId)
        }));
        useAuditStore.getState().logAction('uninstall_module', 'module', moduleId);
      },
      updateModuleConfig: (moduleId, config) => set(state => ({
        installedModules: state.installedModules.map(m => 
          m.moduleId === moduleId ? { ...m, config, lastUpdatedAt: new Date().toISOString() } : m
        )
      })),
      isModuleInstalled: (moduleId) => get().installedModules.some(m => m.moduleId === moduleId),
      isModuleActive: (moduleId) => get().installedModules.some(m => m.moduleId === moduleId && m.status === 'active')
    }),
    { name: 'shipstack-module-storage' }
  )
);

interface AuditState {
  auditLog: AuditLogEntry[];
  logAction: (action: string, resource: string, resourceId?: string, metadata?: Record<string, unknown>, severity?: AuditLogEntry['severity']) => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      auditLog: [],
      logAction: (action, resource, resourceId, metadata, severity = 'info') => {
        const user = useAuthStore.getState().user;
        const entry: AuditLogEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId: user?.tenantId || 'unknown',
          userId: user?.id || 'system',
          userEmail: user?.email || 'system@shipstack.io',
          action,
          resource,
          resourceId,
          metadata,
          severity,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        };
        set(state => ({ auditLog: [entry, ...state.auditLog].slice(0, 1000) }));
      }
    }),
    { name: 'shipstack-audit-storage' }
  )
);

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  locationPermission: 'granted' | 'denied' | 'prompt';
  setLocationPermission: (status: 'granted' | 'denied' | 'prompt') => void;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: string | Omit<Notification, 'id' | 'createdAt' | 'read' | 'timestamp' | 'tenantId' | 'persistent'> & { persistent?: boolean }, type?: Notification['type']) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      isOnline: navigator.onLine,
      setIsOnline: (online) => set({ isOnline: online }),
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),
      locationPermission: 'prompt',
      setLocationPermission: (status) => set({ locationPermission: status }),
      notifications: [],
      unreadCount: 0,
      addNotification: (n, type = 'info') => set((state) => {
        let payload: any;
        if (typeof n === 'string') {
          payload = {
            title: n,
            message: n,
            type: type,
            category: 'GENERAL',
            persistent: false
          };
        } else {
          payload = n;
        }

        const newNotif: Notification = {
          ...payload,
          id: Math.random().toString(36).substr(2, 9),
          tenantId: 'current',
          read: false,
          timestamp: new Date().toISOString(),
          persistent: payload.persistent || false
        };
        const notifications = [newNotif, ...state.notifications].slice(0, 100);
        return { 
          notifications,
          unreadCount: notifications.filter(x => !x.read).length
        };
      }),
      markRead: (id) => set((state) => {
        const notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        return {
          notifications,
          unreadCount: notifications.filter(x => !x.read).length
        };
      }),
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),
      dismissNotification: (id) => set((state) => {
        const notifications = state.notifications.filter(n => n.id !== id);
        return {
          notifications,
          unreadCount: notifications.filter(x => !x.read).length
        };
      })
    }),
    { name: 'shipstack-app-storage' }
  )
);


interface TenantState {
  currentTenant: Tenant | null;
  theme: {
    primaryColor: string;
    logo?: string;
  };
  setTenant: (tenant: Tenant | null) => void;
  updateTenant: (tenant: Partial<Tenant>) => void;
  setTheme: (theme: { primaryColor: string; logo?: string }) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      theme: {
        primaryColor: '#10B981', // Brand green
      },
      setTenant: (tenant) => {
        set({ 
          currentTenant: tenant,
          theme: {
            primaryColor: tenant?.settings?.primaryColor || '#10B981',
            logo: tenant?.logo
          }
        });
      },
      updateTenant: (data) => set((state) => {
        const updatedTenant = state.currentTenant ? { ...state.currentTenant, ...data } : null;
        return {
          currentTenant: updatedTenant,
          theme: data.settings?.primaryColor ? { ...state.theme, primaryColor: data.settings.primaryColor } : state.theme
        };
      }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'shipstack-tenant-storage' }
  )
);
