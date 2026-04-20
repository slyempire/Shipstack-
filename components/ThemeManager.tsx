
import React, { useEffect } from 'react';
import { useTenantStore } from '../store';

interface ThemeManagerProps {
  children: React.ReactNode;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const { theme: tenantTheme } = useTenantStore();
  
  useEffect(() => {
    // Apply primary color to CSS variable
    if (tenantTheme.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', tenantTheme.primaryColor);
    }
  }, [tenantTheme.primaryColor]);

  return <>{children}</>;
};

export default ThemeManager;
