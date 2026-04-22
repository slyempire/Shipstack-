
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Force Onboarding for new Shipstack users
  if (user && !user.isOnboarded && location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: User not onboarded, redirecting to /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && user) {
    const userRole = user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    
    // Check if directly allowed OR if user is an admin and admin/tenant_admin is allowed
    const isAllowed = normalizedAllowed.includes(userRole) || 
                     (userRole === 'super_admin') ||
                     ((normalizedAllowed.includes('admin') || normalizedAllowed.includes('tenant_admin')) && 
                      ['admin', 'tenant_admin', 'super_admin'].includes(userRole));
    
    if (!isAllowed) {
      console.log('ProtectedRoute: Role not allowed', { role: user.role, allowedRoles });
      // Redirect to their respective portals based on role
      if (userRole === 'driver') return <Navigate to="/driver" />;
      if (userRole === 'facility' || userRole === 'facility_operator') return <Navigate to="/facility" />;
      if (userRole === 'client') return <Navigate to="/client" />;
      if (userRole === 'warehouse') return <Navigate to="/admin/warehouse" />;
      
      // Default fallback for unauthorized access to a specific admin route
      if (location.pathname !== '/admin') {
        console.log('ProtectedRoute: Redirecting to /admin as fallback');
        return <Navigate to="/admin" />;
      }
      
      console.log('ProtectedRoute: Final fallback to /');
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
