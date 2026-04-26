
import { useEffect } from 'react';
import { useTenantStore, useAuthStore } from '../store';
import { Tenant, ModuleId } from '../types';
import { api } from '../api';
import { ROLE_MODULES } from '../constants';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

// Mock data for tenants
const MOCK_TENANTS: Record<string, Tenant> = {
  'nairobi-logistics': {
    id: 'tenant-1',
    name: 'Nairobi Logistics Hub',
    slug: 'nairobi-logistics',
    subdomain: 'nairobi',
    plan: 'GROWTH',
    status: 'ACTIVE',
    industry: 'MEDICAL',
    createdAt: '2023-01-01T00:00:00Z',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#0F2A44',
    },
    enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'finance', 'orders', 'warehouse', 'integrations', 'analytics'],
    securitySettings: {
      auditLogging: true,
      twoFactorAuth: false,
      requireNTSAVerification: true,
    }
  },
  'mombasa-port': {
    id: 'tenant-2',
    name: 'Mombasa Port Transporters',
    slug: 'mombasa-port',
    subdomain: 'mombasa',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    industry: 'GENERAL',
    createdAt: '2023-02-01T00:00:00Z',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#1F6AE1',
    },
    enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'client-portal', 'finance', 'orders', 'warehouse', 'integrations', 'analytics'],
    securitySettings: {
      auditLogging: true,
      twoFactorAuth: true,
      requireNTSAVerification: true,
    }
  }
};

export const useTenant = () => {
  const { currentTenant, setTenant } = useTenantStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // In a real app, we would resolve the tenant from the subdomain or URL
    // For this demo, we'll try to get the persisted tenant first, then fallback to mock
    const initTenant = async () => {
      if (!currentTenant) {
        const persistedTenant = await api.getTenant('current');
        if (persistedTenant) {
          setTenant(persistedTenant);
          return;
        }

        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        const resolvedTenant = MOCK_TENANTS[subdomain] || MOCK_TENANTS['nairobi-logistics'];
        setTenant(resolvedTenant);
      }
    };

    initTenant();
  }, [currentTenant, setTenant]);

  return {
    tenant: currentTenant,
    isGrowthPlus: currentTenant?.plan === 'GROWTH' || currentTenant?.plan === 'SCALE' || currentTenant?.plan === 'ENTERPRISE',
    isEnterprise: currentTenant?.plan === 'ENTERPRISE',
    formatCurrency: (amount: number) => formatCurrency(amount, currentTenant),
    currencySymbol: getCurrencySymbol(currentTenant),
    updateTenant: (updates: Partial<Tenant>) => {
      if (currentTenant) {
        setTenant({ ...currentTenant, ...updates });
      }
    },
    isModuleEnabled: (moduleId: ModuleId) => {
      try {
        if (!moduleId) return true;
        
        const isDemoUser = user?.email?.endsWith('@shipstack.com') ||
                          user?.email === 'admin@shipstack.com' ||
                          window.location.search.includes('demo=true') ||
                          localStorage.getItem('shipstack_demo_mode') === 'true';
        
        // 1. Check if module is enabled for the tenant
        const enabledModules = currentTenant?.enabledModules;
        
        // For demo users, we bypass the tenant check to show all capabilities
        if (isDemoUser) return true;

        const isTenantEnabled = Array.isArray(enabledModules) ? enabledModules.includes(moduleId) : true;
        
        if (!isTenantEnabled) return false;

        // 2. Admins have access to all modules enabled for the tenant
        if (user?.role === 'ADMIN') return true;

        // 3. Check user-specific overrides
        if (user?.enabledModules && Array.isArray(user.enabledModules) && user.enabledModules.length > 0) {
          return user.enabledModules.includes(moduleId);
        }

        // 4. Default role-based access (if no overrides)
        if (user?.role && ROLE_MODULES && ROLE_MODULES[user.role]) {
          return ROLE_MODULES[user.role].includes(moduleId);
        }

        return true; // Default to true for unknown roles or if no mapping exists
      } catch (err) {
        console.error('Error in isModuleEnabled:', err);
        return true; // Fallback to true to avoid locking users out on error
      }
    },
  };
};
