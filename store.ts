
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, Tenant, Notification } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      }))
    }),
    { name: 'shipstack-auth-storage' }
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
        primaryColor: '#0F172A', // Default brand color
      },
      setTenant: (tenant) => set({ 
        currentTenant: tenant,
        theme: {
          primaryColor: tenant?.settings?.primaryColor || '#0F172A',
          logo: tenant?.logo
        }
      }),
      updateTenant: (data) => set((state) => ({
        currentTenant: state.currentTenant ? { ...state.currentTenant, ...data } : null,
        theme: data.settings?.primaryColor ? { ...state.theme, primaryColor: data.settings.primaryColor } : state.theme
      })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'shipstack-tenant-storage' }
  )
);

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unavailable';
  setLocationPermission: (status: 'granted' | 'denied' | 'prompt' | 'unavailable') => void;
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  notifications: Array<{ id: string; message: string; type: 'info' | 'error' | 'success'; read: boolean; timestamp: string }>;
  addNotification: (message: string, type: 'info' | 'error' | 'success') => void;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  driverNotifications: Notification[];
  setDriverNotifications: (notifications: Notification[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isOnline: navigator.onLine,
  setIsOnline: (online) => set({ isOnline: online }),
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  locationPermission: 'prompt',
  setLocationPermission: (status) => set({ locationPermission: status }),
  deferredPrompt: null,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  notifications: [],
  addNotification: (message, type) => set((state) => ({
    notifications: [{ 
      id: Math.random().toString(), 
      message, 
      type, 
      read: false, 
      timestamp: new Date().toISOString() 
    }, ...state.notifications].slice(0, 50) // Keep last 50
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  clearNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearAllNotifications: () => set({ notifications: [] }),
  driverNotifications: [],
  setDriverNotifications: (notifications) => set({ driverNotifications: notifications }),
}));
