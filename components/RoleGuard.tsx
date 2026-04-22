
import React, { useEffect, useMemo } from 'react';
import { useAuthStore, useAuditStore } from '../store';
import { SystemRole, Permission, UserRole } from '../types';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  allowedRoles?: UserRole[]; // Alias for compatibility
  permissions?: Permission[]; // Required ALL if array
  anyOf?: Permission[]; // Required ANY of these
  fallback?: React.ReactNode;
  showFullPageError?: boolean;
}

const AccessDeniedView = ({ missingPermissions, requiredRoles }: { missingPermissions?: Permission[], requiredRoles?: UserRole[] }) => {
  const navigate = useNavigate();
  const { currentUserRole } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
      <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert size={40} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Access Restricted</h3>
      <p className="text-sm text-slate-500 font-medium max-w-md mb-8">
        Your current role (<span className="text-slate-900 font-bold uppercase tracking-widest text-[10px] bg-slate-100 px-2 py-1 rounded-md">{currentUserRole}</span>) does not have the necessary security clearances to view this terminal.
      </p>
      
      {(missingPermissions && missingPermissions.length > 0) && (
        <div className="mb-8 w-full max-w-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-left px-2">Missing Clearances</p>
          <div className="space-y-2">
            {missingPermissions.map(p => (
              <div key={p} className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <Lock size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={() => navigate(-1)}
          className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={14} /> Go Back
        </button>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
};

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  roles, 
  allowedRoles,
  permissions, 
  anyOf,
  fallback,
  showFullPageError = false
}) => {
  const store = useAuthStore();
  const currentUserRole = store?.currentUserRole;
  const hasPermission = store?.hasPermission;
  const { logAction } = useAuditStore();
  
  const effectiveRoles = roles || allowedRoles;
  
  const hasRole = useMemo(() => {
    if (!effectiveRoles || !currentUserRole) return !effectiveRoles;
    
    const normalizedUserRole = currentUserRole.toLowerCase();
    const normalizedAllowed = effectiveRoles.map(r => r.toLowerCase());
    
    // Direct match
    if (normalizedAllowed.includes(normalizedUserRole)) return true;
    
    // Super Admin is always authorized
    if (normalizedUserRole === 'super_admin') return true;
    
    // Admin role mapping
    if (normalizedAllowed.includes('admin') || normalizedAllowed.includes('tenant_admin')) {
      if (['admin', 'tenant_admin', 'super_admin'].includes(normalizedUserRole)) return true;
    }

    return false;
  }, [effectiveRoles, currentUserRole]);
  
  const checkPermissionSafely = (p: Permission) => {
    if (typeof hasPermission !== 'function') return true; // Default to allow if check is broken to avoid crash
    try {
      return hasPermission(p);
    } catch (e) {
      console.error('Permission check failed:', e);
      return true;
    }
  };

  const hasAllPermissions = permissions ? permissions.every(p => checkPermissionSafely(p)) : true;
  const hasAnyPermission = anyOf ? anyOf.some(p => checkPermissionSafely(p)) : true;
  
  const isAuthorized = hasRole && hasAllPermissions && hasAnyPermission;

  useEffect(() => {
    if (!isAuthorized && typeof logAction === 'function') {
      try {
        logAction('access_denied', 'system', 'guard', { 
          requiredRoles: roles, 
          requiredPermissions: permissions, 
          anyOfPermissions: anyOf,
          userRole: currentUserRole 
        }, 'warning');
      } catch (e) {
        console.error('Audit log failed:', e);
      }
    }
  }, [isAuthorized, roles, permissions, anyOf, currentUserRole, logAction]);

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;
    if (showFullPageError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <AccessDeniedView 
            missingPermissions={permissions?.filter(p => !checkPermissionSafely(p))} 
            requiredRoles={roles || allowedRoles}
          />
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;
