
import React from 'react';
import { useTenant } from '../hooks/useTenant';

interface TenantInitializerProps {
  children: React.ReactNode;
}

export const TenantInitializer: React.FC<TenantInitializerProps> = ({ children }) => {
  useTenant();
  return <>{children}</>;
};

export default TenantInitializer;
