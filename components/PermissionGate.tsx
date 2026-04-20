
import React from 'react';
import { useAuthStore } from '../store';
import { Permission } from '../types';

interface PermissionGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGate
 * A lightweight inline guard that hides/shows children based on a single permission.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  fallback = null, 
  children 
}) => {
  const { hasPermission } = useAuthStore();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
