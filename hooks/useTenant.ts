
import { useEffect } from 'react';
import { useTenantStore, useAuthStore } from '../store';
import { Tenant, ModuleId } from '../types';

// Mock data for tenants
const MOCK_TENANTS: Record<string, Tenant> = {
  'nairobi-logistics': {
    id: 'tenant-1',
    name: 'Nairobi Logistics Hub',
    subdomain: 'nairobi',
    plan: 'PRO',
    status: 'ACTIVE',
    industry: 'MEDICAL',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#0F2A44',
    },
    enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'finance'],
    securitySettings: {
      auditLogging: true,
      twoFactorAuth: false,
      requireNTSAVerification: true,
    }
  },
  'mombasa-port': {
    id: 'tenant-2',
    name: 'Mombasa Port Transporters',
    subdomain: 'mombasa',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    industry: 'GENERAL',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#1F6AE1',
    },
    enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'client-portal', 'finance'],
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
    // For this demo, we'll default to Nairobi if none is set
    if (!currentTenant) {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      const resolvedTenant = MOCK_TENANTS[subdomain] || MOCK_TENANTS['nairobi-logistics'];
      setTenant(resolvedTenant);
    }
  }, [currentTenant, setTenant]);

  return {
    tenant: currentTenant,
    isPro: currentTenant?.plan === 'PRO' || currentTenant?.plan === 'ENTERPRISE',
    isEnterprise: currentTenant?.plan === 'ENTERPRISE',
    isModuleEnabled: (moduleId: ModuleId) => {
      // 1. Check if module is enabled for the tenant
      const isTenantEnabled = currentTenant?.enabledModules?.includes(moduleId) ?? true;
      if (!isTenantEnabled) return false;

      // 2. Admins have access to all tenant-enabled modules
      if (user?.role === 'ADMIN') return true;

      // 3. Check user-specific overrides
      // If the user has an enabledModules list, it must include the moduleId
      if (user?.enabledModules && user.enabledModules.length > 0) {
        return user.enabledModules.includes(moduleId);
      }

      // 4. Default role-based access (if no overrides)
      // This is a simplified mapping for the demo
      const roleModules: Record<string, ModuleId[]> = {
        'DISPATCHER': ['dispatch', 'fleet', 'orders'],
        'FINANCE': ['finance', 'orders'],
        'FACILITY': ['facility-portal', 'warehouse'],
        'WAREHOUSE': ['warehouse', 'orders'],
        'DRIVER': ['driver-portal', 'fleet'],
        'CLIENT': ['client-portal', 'orders']
      };

      if (user?.role && roleModules[user.role]) {
        return roleModules[user.role].includes(moduleId);
      }

      return true; // Default to true for unknown roles or if no mapping exists
    },
  };
};
