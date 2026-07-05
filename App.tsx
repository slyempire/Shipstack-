
import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore, useTenantStore } from './store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTenant } from './hooks/useTenant';
import { FrappeAuthService } from './services/frappe-auth';
import { api } from './api';

import ErrorBoundary from './components/ErrorBoundary';
import { ModuleGuard } from './components/ModuleGuard';
import ProtectedRoute from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import NotificationToast from './components/NotificationToast';
import TenantInitializer from './components/TenantInitializer';
import ThemeManager from './components/ThemeManager';

// Marketing Views
import LandingPage from './views/marketing/LandingPage';
const ProductPage = React.lazy(() => import('./views/marketing/ProductPage'));
const SolutionsPage = React.lazy(() => import('./views/marketing/SolutionsPage'));
const AboutPage = React.lazy(() => import('./views/marketing/AboutPage'));
const ContactPage = React.lazy(() => import('./views/marketing/ContactPage'));
const InfrastructurePage = React.lazy(() => import('./views/marketing/InfrastructurePage'));
const PricingPage = React.lazy(() => import('./views/marketing/PricingPage'));
const RegisterPage = React.lazy(() => import('./views/marketing/RegisterPage'));
const DriverRecruitmentView = React.lazy(() => import('./views/marketing/DriverRecruitmentView'));
const DriverRegistrationForm = React.lazy(() => import('./views/marketing/DriverRegistrationForm'));
const LegalPage = React.lazy(() => import('./views/marketing/LegalPage'));
const OnboardingFlow = React.lazy(() => import('./views/onboarding/OnboardingFlow'));

const LoginView = React.lazy(() => import('./views/LoginView'));
const ForgotPasswordView = React.lazy(() => import('./views/ForgotPasswordView'));
const ResetPasswordView = React.lazy(() => import('./views/ResetPasswordView'));
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
const RecruitmentManagement = React.lazy(() => import('./views/admin/RecruitmentManagement'));
const SecurityCommandCenter = React.lazy(() => import('./views/admin/SecurityCommandCenter'));
const FleetManagement = React.lazy(() => import('./views/admin/FleetManagement'));
const OrderManagement = React.lazy(() => import('./views/admin/OrderManagement'));
const WarehouseManagement = React.lazy(() => import('./views/admin/WarehouseManagement'));
const SubscriptionView = React.lazy(() => import('./views/admin/SubscriptionView'));
const CRMView = React.lazy(() => import('./views/admin/CRMView'));
const DataIngress = React.lazy(() => import('./views/admin/DataIngress'));
const MarketplaceView = React.lazy(() => import('./views/admin/MarketplaceView'));
const TaskManagementView = React.lazy(() => import('./views/admin/TaskManagementView'));
const TenantManagement = React.lazy(() => import('./views/admin/TenantManagement'));
const DriverPortal = React.lazy(() => import('./views/driver/DriverPortal'));
const TrackPackage = React.lazy(() => import('./views/public/TrackPackage'));
const DriverAuxiliary = React.lazy(() => import('./views/driver/DriverAuxiliary'));
const FacilityPortal = React.lazy(() => import('./views/facility/FacilityPortal'));
const ClientPortal = React.lazy(() => import('./views/client/ClientPortal'));

// Shared Views
const ProfileView = React.lazy(() => import('./views/shared/ProfileView'));
const SettingsView = React.lazy(() => import('./views/shared/SettingsView'));
const LegalView = React.lazy(() => import('./views/shared/LegalView'));
const StyleGuide = React.lazy(() => import('./views/marketing/StyleGuide'));
const HealthcareDashboard = React.lazy(() => import('./views/industry/HealthcareDashboard'));

const DashboardSwitcher = () => {
  const user = useAuthStore(state => state.user);
  const role = user?.role?.toLowerCase();
  
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Terminal...</span>
        </div>
      </div>
    }>
      {(() => {
        if (role === 'dispatcher') return <DispatchDashboard />;
        if (role === 'warehouse' || role === 'facility_operator') return <ModuleGuard moduleId="warehouse"><WarehouseManagement /></ModuleGuard>;
        if (role === 'driver') return <DriverPortal />;
        if (role === 'client') return <ClientPortal />;
        
        return <AdminDashboard />;
      })()}
    </Suspense>
  );
};

const App: React.FC = () => {
  const setIsOnline = useAppStore(state => state.setIsOnline);
  const addNotification = useAppStore(state => state.addNotification);
  
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    // Demo/mock sessions have no Frappe cookie session behind them —
    // syncing would always come back "not logged in" and kick the user out.
    const isMockSession = localStorage.getItem('shipstack_demo_mode') === 'true' ||
                          useAuthStore.getState().token === 'mock-jwt-token';
    if (isMockSession) {
      setIsInitializing(false);
      return;
    }

    // Check initial session from Frappe. getLoggedUser resolves null only
    // when the ERP answered "not logged in"; connection failures reject and
    // land in catch(), where we keep the local session (fail open — the
    // server still rejects unauthorized API calls).
    FrappeAuthService.getLoggedUser()
      .then(user => {
        if (user) {
          login(user, 'frappe-session');
        } else if (isAuthenticated) {
          logout();
        }
      })
      .catch(err => {
        console.error('Failed to sync auth state with Frappe', err);
      })
      .finally(() => {
        setIsInitializing(false);
      });
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
      <div className="flex h-screen items-center justify-center bg-eggshell">
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
          <Suspense fallback={<div className="flex h-screen items-center justify-center bg-eggshell"><div className="animate-spin h-10 w-10 border-4 border-brand border-t-transparent rounded-full shadow-lg" /></div>}>
            <ErrorBoundary componentName="Global App Shell">
              <Routes>
                {/* Public Marketing Routes - Always visible */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/solutions/*" element={<SolutionsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/infrastructure" element={<InfrastructurePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/recruitment" element={<DriverRecruitmentView />} />
                <Route path="/driver-recruitment" element={<DriverRecruitmentView />} />
                <Route path="/register-driver" element={<DriverRegistrationForm />} />
                <Route path="/login" element={<LoginView />} />
                <Route path="/forgot-password" element={<ForgotPasswordView />} />
                <Route path="/reset-password" element={<ResetPasswordView />} />
                <Route path="/legal" element={<LegalView />} />
                <Route path="/legal/:section" element={<LegalPage />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/solutions/healthcare" element={<HealthcareDashboard />} />
                <Route path="/track" element={<TrackPackage />} />
                <Route path="/track/:id" element={<TrackPackage />} />
                
                {/* Onboarding Flow - Publicly accessible but requires auth to complete */}
                <Route path="/onboarding" element={<OnboardingFlow />} />

                {/* Core App Routes - Guarded */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher', 'finance_manager', 'facility_operator']} permissions={['dashboard:view']} showFullPageError>
                      <DashboardSwitcher />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/dispatch" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']} permissions={['dispatch:manage']} showFullPageError>
                      <ModuleGuard moduleId="dispatch">
                        <ErrorBoundary componentName="Trip Management">
                          <TripManagement />
                        </ErrorBoundary>
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['analytics:view']} showFullPageError>
                      <ModuleGuard moduleId="analytics">
                        <Analytics />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['users:manage']} showFullPageError>
                      <UserManagement />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/recruitment" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'recruiter']} permissions={['recruitment:all']} showFullPageError>
                      <RecruitmentManagement />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/security" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['security:view']} showFullPageError>
                      <SecurityCommandCenter />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']} permissions={['orders:view']} showFullPageError>
                      <ModuleGuard moduleId="orders">
                        <OrderManagement />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/warehouse" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher', 'facility_operator']} permissions={['warehouse:manage']} showFullPageError>
                      <ModuleGuard moduleId="warehouse">
                        <WarehouseManagement />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/fleet" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'fleet_manager']} permissions={['fleet:manage']} showFullPageError>
                      <ModuleGuard moduleId="fleet">
                        <FleetManagement />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tasks" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher', 'recruiter', 'fleet_manager']} permissions={['tasks:view']} showFullPageError>
                      <TaskManagementView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/ingress" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'analyst']} permissions={['data_ingress:manage']} showFullPageError>
                      <ModuleGuard moduleId="integrations">
                        <DataIngress />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/queue" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']} permissions={['dispatch:view']} showFullPageError>
                      <ModuleGuard moduleId="dispatch">
                        <DNQueue />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tracking" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']} permissions={['tracking:view']} showFullPageError>
                      <ModuleGuard moduleId="dispatch">
                        <LiveTracking />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/exceptions" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']} permissions={['exceptions:view']} showFullPageError>
                      <ModuleGuard moduleId="dispatch">
                        <ExceptionsView />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/tenants" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin']} permissions={['users:manage']} showFullPageError>
                      <TenantManagement />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/trip/:id" element={
                  <ProtectedRoute>
                    <RoleGuard permissions={['trips:view']} showFullPageError>
                      <TripDetail />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/billing" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'finance_manager']} permissions={['finance:manage']} showFullPageError>
                      <ModuleGuard moduleId="finance">
                        <Invoicing />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/rates" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin', 'finance_manager']} permissions={['rates:all']} showFullPageError>
                      <ModuleGuard moduleId="finance">
                        <RateProfiles />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/subscription" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['subscription:manage']} showFullPageError>
                      <SubscriptionView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/crm" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['crm:manage']} showFullPageError>
                      <CRMView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/admin/marketplace" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super_admin', 'tenant_admin']} permissions={['marketplace:view']} showFullPageError>
                      <MarketplaceView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <RoleGuard permissions={['dashboard:view']} showFullPageError>
                      <ProfileView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <RoleGuard permissions={['dashboard:view']} showFullPageError>
                      <SettingsView />
                    </RoleGuard>
                  </ProtectedRoute>
                } />

                <Route path="/driver" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['driver']} showFullPageError>
                      <ModuleGuard moduleId="driver-portal">
                        <DriverPortal />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/driver/hub" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['driver']} showFullPageError>
                      <ModuleGuard moduleId="driver-portal">
                        <DriverAuxiliary />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/facility" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['facility_operator']} showFullPageError>
                      <ModuleGuard moduleId="facility-portal">
                        <FacilityPortal />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />
                <Route path="/client" element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['client']} showFullPageError>
                      <ModuleGuard moduleId="client-portal">
                        <ClientPortal />
                      </ModuleGuard>
                    </RoleGuard>
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </ThemeManager>
      </TenantInitializer>
    </HashRouter>
  );
};

export default App;
