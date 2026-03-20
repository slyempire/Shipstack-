
import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore, useTenantStore } from './store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTenant } from './hooks/useTenant';
import { auth, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from './api';

import ErrorBoundary from './components/ErrorBoundary';
import { ModuleGuard } from './components/ModuleGuard';

// Marketing Views
import LandingPage from './views/marketing/LandingPage';
const InfrastructurePage = React.lazy(() => import('./views/marketing/InfrastructurePage'));
const PricingPage = React.lazy(() => import('./views/marketing/PricingPage'));
const RegisterPage = React.lazy(() => import('./views/marketing/RegisterPage'));
const OnboardingView = React.lazy(() => import('./views/onboarding/OnboardingView'));

const LoginView = React.lazy(() => import('./views/LoginView'));
const AdminDashboard = React.lazy(() => import('./views/admin/AdminDashboard'));
const DispatchDashboard = React.lazy(() => import('./views/dispatch/DispatchDashboard'));
const TripManagement = React.lazy(() => import('./views/admin/TripManagement'));
const DNQueue = React.lazy(() => import('./views/admin/DNQueue'));
const LiveTracking = React.lazy(() => import('./views/admin/LiveTracking'));
const TripDetail = React.lazy(() => import('./views/admin/TripDetail'));
const Invoicing = React.lazy(() => import('./views/admin/Invoicing'));
const RateProfiles = React.lazy(() => import('./views/admin/RateProfiles'));
const ExceptionsView = React.lazy(() => import('./views/admin/ExceptionsView'));
const Analytics = React.lazy(() => import('./views/admin/Analytics'));
const UserManagement = React.lazy(() => import('./views/admin/UserManagement'));
const SecurityAudit = React.lazy(() => import('./views/admin/SecurityAudit'));
const FleetManagement = React.lazy(() => import('./views/admin/FleetManagement'));
const OrderManagement = React.lazy(() => import('./views/admin/OrderManagement'));
const WarehouseManagement = React.lazy(() => import('./views/admin/WarehouseManagement'));
const SubscriptionView = React.lazy(() => import('./views/admin/SubscriptionView'));
const DataIngress = React.lazy(() => import('./views/admin/DataIngress'));
const DriverPortal = React.lazy(() => import('./views/driver/DriverPortal'));
const DriverAuxiliary = React.lazy(() => import('./views/driver/DriverAuxiliary'));
const FacilityPortal = React.lazy(() => import('./views/facility/FacilityPortal'));
const ClientPortal = React.lazy(() => import('./views/client/ClientPortal'));

// Shared Views
const ProfileView = React.lazy(() => import('./views/shared/ProfileView'));
const SettingsView = React.lazy(() => import('./views/shared/SettingsView'));
const LegalView = React.lazy(() => import('./views/shared/LegalView'));

const TenantInitializer = ({ children }: { children: React.ReactNode }) => {
  useTenant();
  return <>{children}</>;
};

const ThemeManager = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTenantStore();
  const { user } = useAuthStore();
  const location = useLocation();
  
  useEffect(() => {
    // Apply primary color to CSS variable
    if (theme.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', theme.primaryColor);
    }
    
    // Apply dark mode based on user preferences
    // Only apply to "sessions" (non-marketing routes)
    const marketingRoutes = ['/', '/infrastructure', '/pricing', '/register', '/login', '/legal'];
    const isMarketingRoute = marketingRoutes.includes(location.pathname);
    const isDark = user?.preferences?.theme === 'DARK' && !isMarketingRoute;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.primaryColor, user?.preferences?.theme, location.pathname]);

  return <>{children}</>;
};

const NotificationToast = () => {
  const { notifications, clearNotification } = useAppStore();
  
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        // Clear the oldest unread notification if it exists
        const oldest = notifications[notifications.length - 1];
        if (oldest) clearNotification(oldest.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, clearNotification]);

  if (notifications.length === 0) return null;
  
  // Only show the most recent 3 toasts to avoid clutter
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {visibleNotifications.map((n) => (
        <div key={n.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-4 duration-300 ${n.type === 'success' ? 'bg-white border-green-100 text-green-800' : n.type === 'error' ? 'bg-white border-red-100 text-red-800' : 'bg-white border-blue-100 text-blue-800'}`}>
          {n.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
          {n.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
          {n.type === 'info' && <Info size={18} className="text-blue-500" />}
          <span className="text-xs font-bold">{n.message}</span>
          <button onClick={() => clearNotification(n.id)} className="ml-2 p-1 hover:bg-slate-50 rounded-full"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Force Onboarding for new Shipstack users
  if (user && !user.isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their respective portals based on role
    if (user.role === 'DRIVER') return <Navigate to="/driver" />;
    if (user.role === 'FACILITY') return <Navigate to="/facility" />;
    if (user.role === 'CLIENT') return <Navigate to="/client" />;
    if (user.role === 'WAREHOUSE') return <Navigate to="/admin/warehouse" />;
    
    // Default fallback for unauthorized access to a specific admin route
    // If they are already at /admin, don't redirect to /admin
    if (location.pathname !== '/admin') {
      return <Navigate to="/admin" />;
    }
    
    // If they are at /admin and still not authorized (shouldn't happen with above logic but for safety)
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

const DashboardSwitcher = () => {
  const { user } = useAuthStore();
  if (user?.role === 'DISPATCHER') return <DispatchDashboard />;
  return <AdminDashboard />;
};

const App: React.FC = () => {
  const { setIsOnline, addNotification } = useAppStore();
  const { login, logout, isAuthenticated } = useAuthStore();

  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!isAuthenticated) {
          // Sync store if Firebase has a user but store doesn't
          try {
            const user = await api.getUserById(firebaseUser.uid);
            if (user) {
              const token = await firebaseUser.getIdToken();
              login(user, token);
            } else if (firebaseUser.email) {
              const legacyUser = await api.getUserByEmail(firebaseUser.email);
              if (legacyUser) {
                const token = await firebaseUser.getIdToken();
                login(legacyUser, token);
              }
            }
          } catch (err) {
            console.error('Failed to sync auth state', err);
          }
        }
      } else {
        if (isAuthenticated) {
          logout();
        }
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, login, logout]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); addNotification("Connection restored.", "success"); };
    const handleOffline = () => { setIsOnline(false); addNotification("Offline mode active.", "info"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-brand border-t-transparent rounded-full shadow-lg" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing Stack...</span>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <TenantInitializer>
        <ThemeManager>
          <NotificationToast />
          <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-brand border-t-transparent rounded-full shadow-lg" /></div>}>
            <Routes>
              {/* Public Marketing Routes - Always visible */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/infrastructure" element={<InfrastructurePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/legal" element={<LegalView />} />
              
              {/* Onboarding Flow */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingView /></ProtectedRoute>} />

              {/* Core App Routes - Guarded */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER', 'FINANCE']}>
                  <DashboardSwitcher />
                </ProtectedRoute>
              } />
              <Route path="/admin/dispatch" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="dispatch"><ErrorBoundary componentName="Trip Management"><TripManagement /></ErrorBoundary></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><ModuleGuard moduleId="analytics"><Analytics /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['ADMIN']}><SecurityAudit /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="orders"><OrderManagement /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/warehouse" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER', 'WAREHOUSE']}><ModuleGuard moduleId="warehouse"><WarehouseManagement /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/fleet" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="fleet"><FleetManagement /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/ingress" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="integrations"><DataIngress /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/queue" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="dispatch"><DNQueue /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/tracking" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="dispatch"><LiveTracking /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/exceptions" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><ModuleGuard moduleId="dispatch"><ExceptionsView /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/trip/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE']}><ModuleGuard moduleId="finance"><Invoicing /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/rates" element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE']}><ModuleGuard moduleId="finance"><RateProfiles /></ModuleGuard></ProtectedRoute>} />
              <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={['ADMIN']}><SubscriptionView /></ProtectedRoute>} />
              
              <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />

              <Route path="/driver" element={<ProtectedRoute allowedRoles={['DRIVER']}><ModuleGuard moduleId="driver-portal"><DriverPortal /></ModuleGuard></ProtectedRoute>} />
              <Route path="/driver/hub" element={<ProtectedRoute allowedRoles={['DRIVER']}><ModuleGuard moduleId="driver-portal"><DriverAuxiliary /></ModuleGuard></ProtectedRoute>} />
              <Route path="/facility" element={<ProtectedRoute allowedRoles={['FACILITY']}><ModuleGuard moduleId="facility-portal"><FacilityPortal /></ModuleGuard></ProtectedRoute>} />
              <Route path="/client" element={<ProtectedRoute allowedRoles={['CLIENT']}><ModuleGuard moduleId="client-portal"><ClientPortal /></ModuleGuard></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ThemeManager>
      </TenantInitializer>
    </HashRouter>
  );
};

export default App;
