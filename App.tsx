
import React, { Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useTenantStore } from './store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTenant } from './hooks/useTenant';
import { supabase, isSupabaseConfigured } from './supabase';
import { api } from './api';

import ErrorBoundary from './components/ErrorBoundary';
import { ModuleGuard } from './components/ModuleGuard';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';
import CookieConsent from './components/CookieConsent';
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
const OnboardingFlow = React.lazy(() => import('./views/onboarding/OnboardingFlow'));
const OnboardingView = React.lazy(() => import('./views/onboarding/OnboardingView'));
const WelcomeTutorial = React.lazy(() => import('./components/WelcomeTutorial'));

const LoginView = React.lazy(() => import('./views/LoginView'));
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
const SecurityAudit = React.lazy(() => import('./views/admin/SecurityAudit'));
const FleetManagement = React.lazy(() => import('./views/admin/FleetManagement'));
const OrderManagement = React.lazy(() => import('./views/admin/OrderManagement'));
const WarehouseManagement = React.lazy(() => import('./views/admin/WarehouseManagement'));
const SubscriptionView = React.lazy(() => import('./views/admin/SubscriptionView'));
const CRMView = React.lazy(() => import('./views/admin/CRMView'));
const DataIngress = React.lazy(() => import('./views/admin/DataIngress'));
const MarketplaceView = React.lazy(() => import('./views/admin/MarketplaceView'));
const DriverPortal = React.lazy(() => import('./views/driver/DriverPortal'));
const DriverAuxiliary = React.lazy(() => import('./views/driver/DriverAuxiliary'));
const FacilityPortal = React.lazy(() => import('./views/facility/FacilityPortal'));
const ClientPortal = React.lazy(() => import('./views/client/ClientPortal'));

// Shared Views
const ProfileView = React.lazy(() => import('./views/shared/ProfileView'));
const SettingsView = React.lazy(() => import('./views/shared/SettingsView'));
const LegalView = React.lazy(() => import('./views/shared/LegalView'));
const StyleGuide = React.lazy(() => import('./views/marketing/StyleGuide'));
const HealthcareDashboard = React.lazy(() => import('./views/industry/HealthcareDashboard'));

const TutorialManager: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [showTutorial, setShowTutorial] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user?.isOnboarded) {
      const seen = localStorage.getItem('shipstack_tutorial_seen');
      if (!seen) {
        const timer = setTimeout(() => setShowTutorial(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user?.isOnboarded]);

  if (!showTutorial) return null;
  return (
    <React.Suspense fallback={null}>
      <WelcomeTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </React.Suspense>
  );
};

const DashboardSwitcher = () => {
  const { currentUserRole } = useAuthStore();

  switch (currentUserRole) {
    case 'dispatcher': return <DispatchDashboard />;
    case 'facility_operator': return <ModuleGuard moduleId="warehouse"><WarehouseManagement /></ModuleGuard>;
    case 'driver': return <DriverPortal />;
    case 'client': return <ClientPortal />;
    default: return <AdminDashboard />;
  }
};

const App: React.FC = () => {
  const { setIsOnline, addNotification } = useAppStore();
  const { login, logout, isAuthenticated } = useAuthStore();

  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    console.log('App initialization starting, isSupabaseConfigured:', isSupabaseConfigured, 'supabase:', !!supabase);
    
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured or null, setting isInitializing to false');
      setIsInitializing(false);
      return;
    }

    console.log('Supabase configured, checking session...');
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session check result:', !!session);
      if (session?.user) {
        handleAuthChange(session.user, session.access_token);
      }
      setIsInitializing(false);
    }).catch((error) => {
      console.error('Error checking session:', error);
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthChange(session.user, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        if (isAuthenticated) {
          logout();
        }
      }
    });

    async function handleAuthChange(supabaseUser: any, token: string) {
      if (!isAuthenticated) {
        try {
          const user = await api.getUserById(supabaseUser.id);
          if (user) {
            login(user, token);
          } else if (supabaseUser.email) {
            const legacyUser = await api.getUserByEmail(supabaseUser.email);
            if (legacyUser) {
              login(legacyUser, token);
            }
          }
        } catch (err) {
          console.error('Failed to sync auth state', err);
        }
      }
    }

    return () => subscription.unsubscribe();
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
          <TutorialManager />
          <CookieConsent />
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
                <Route path="/reset-password" element={<ResetPasswordView />} />
                <Route path="/legal" element={<LegalView />} />
                <Route path="/legal/:section" element={<LegalView />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/solutions/healthcare" element={<HealthcareDashboard />} />
                
                {/* Onboarding Flow - Publicly accessible but requires auth to complete */}
                <Route path="/onboarding" element={<OnboardingView />} />
                <Route path="/onboarding/enterprise" element={<OnboardingFlow />} />

                {/* Core App Routes - Guarded */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher', 'finance_manager', 'facility_operator']}>
                    <DashboardSwitcher />
                  </ProtectedRoute>
                } />
                <Route path="/admin/dispatch" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']}><ModuleGuard moduleId="dispatch"><ErrorBoundary componentName="Trip Management"><TripManagement /></ErrorBoundary></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}><ModuleGuard moduleId="analytics"><Analytics /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/recruitment" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'recruiter']}><RecruitmentManagement /></ProtectedRoute>} />
                <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}><SecurityAudit /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']}><ModuleGuard moduleId="orders"><OrderManagement /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/warehouse" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher', 'facility_operator']}><ModuleGuard moduleId="warehouse"><WarehouseManagement /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/fleet" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'fleet_manager']}><ModuleGuard moduleId="fleet"><FleetManagement /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/ingress" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'analyst']}><ModuleGuard moduleId="integrations"><DataIngress /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/queue" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']}><ModuleGuard moduleId="dispatch"><DNQueue /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/tracking" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']}><ModuleGuard moduleId="dispatch"><LiveTracking /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/exceptions" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'dispatcher']}><ModuleGuard moduleId="dispatch"><ExceptionsView /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/trip/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
                <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'finance_manager']}><ModuleGuard moduleId="finance"><Invoicing /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/rates" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'finance_manager']}><ModuleGuard moduleId="finance"><RateProfiles /></ModuleGuard></ProtectedRoute>} />
                <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}><SubscriptionView /></ProtectedRoute>} />
                <Route path="/admin/crm" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}><CRMView /></ProtectedRoute>} />
                <Route path="/admin/marketplace" element={<ProtectedRoute allowedRoles={['super_admin', 'tenant_admin', 'analyst']}><MarketplaceView /></ProtectedRoute>} />
                
                <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />

                <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><ModuleGuard moduleId="driver-portal"><DriverPortal /></ModuleGuard></ProtectedRoute>} />
                <Route path="/driver/hub" element={<ProtectedRoute allowedRoles={['driver']}><ModuleGuard moduleId="driver-portal"><DriverAuxiliary /></ModuleGuard></ProtectedRoute>} />
                <Route path="/facility" element={<ProtectedRoute allowedRoles={['facility_operator']}><ModuleGuard moduleId="facility-portal"><FacilityPortal /></ModuleGuard></ProtectedRoute>} />
                <Route path="/client" element={<ProtectedRoute allowedRoles={['client']}><ModuleGuard moduleId="client-portal"><ClientPortal /></ModuleGuard></ProtectedRoute>} />

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
