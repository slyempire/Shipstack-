
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

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: Role not allowed', { role: user.role, allowedRoles });
    // Redirect to their respective portals based on role
    if (user.role === 'DRIVER') return <Navigate to="/driver" />;
    if (user.role === 'FACILITY') return <Navigate to="/facility" />;
    if (user.role === 'CLIENT') return <Navigate to="/client" />;
    if (user.role === 'WAREHOUSE') return <Navigate to="/admin/warehouse" />;
    
    // Default fallback for unauthorized access to a specific admin route
    if (location.pathname !== '/admin') {
      console.log('ProtectedRoute: Redirecting to /admin as fallback');
      return <Navigate to="/admin" />;
    }
    
    console.log('ProtectedRoute: Final fallback to /');
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
