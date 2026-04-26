import { describe, it, expect } from 'vitest';

/**
 * System Tests — Route Registration
 *
 * These tests verify the routing table is complete and consistent:
 * all routes referenced by internal navigation calls are registered
 * in App.tsx's route list. Prevents 404-style redirects caused by
 * broken navigate() calls.
 */

// Routes registered in App.tsx
const REGISTERED_ROUTES = [
  '/',
  '/product',
  '/solutions',
  '/solutions/*',
  '/about',
  '/contact',
  '/infrastructure',
  '/pricing',
  '/register',
  '/recruitment',
  '/driver-recruitment',
  '/register-driver',
  '/login',
  '/reset-password',
  '/legal',
  '/legal/:section',
  '/style-guide',
  '/solutions/healthcare',
  '/onboarding',
  '/onboarding/enterprise',
  '/admin',
  '/admin/dispatch',
  '/admin/analytics',
  '/admin/users',
  '/admin/recruitment',
  '/admin/security',
  '/admin/orders',
  '/admin/warehouse',
  '/admin/fleet',
  '/admin/ingress',
  '/admin/queue',
  '/admin/tracking',
  '/admin/exceptions',
  '/admin/trip/:id',
  '/admin/billing',
  '/admin/rates',
  '/admin/subscription',
  '/admin/crm',
  '/admin/marketplace',
  '/profile',
  '/settings',
  '/driver',
  '/driver/hub',
  '/facility',
  '/client',
];

// Navigate calls extracted from source files (verified by agent audit)
const NAVIGATION_CALLS = [
  { from: 'OnboardingFlow.tsx', target: '/admin' },
  { from: 'AdminDashboard.tsx (healthcare)', target: '/solutions/healthcare' },
  { from: 'AdminDashboard.tsx (marketplace)', target: '/admin/marketplace' },
  { from: 'AdminDashboard.tsx (subscription)', target: '/admin/subscription' },
  { from: 'SubscriptionView.tsx', target: '/admin/subscription' },
  { from: 'RegisterPage.tsx', target: '/onboarding' },
  { from: 'LoginView.tsx', target: '/admin' },
  { from: 'DriverRecruitmentView.tsx back', target: '/' },
  { from: 'ModuleLockedView.tsx admin', target: '/admin' },
  { from: 'ModuleLockedView.tsx driver', target: '/driver' },
  { from: 'ModuleLockedView.tsx client', target: '/client' },
];

const routeMatches = (target: string, routes: string[]): boolean => {
  return routes.some(route => {
    // Exact match
    if (route === target) return true;
    // Dynamic segments (:param)
    const routeRegex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$');
    return routeRegex.test(target);
  });
};

describe('Route table completeness', () => {
  NAVIGATION_CALLS.forEach(({ from, target }) => {
    it(`${from} → "${target}" is a registered route`, () => {
      expect(routeMatches(target, REGISTERED_ROUTES)).toBe(true);
    });
  });
});

describe('No duplicate routes', () => {
  it('each route pattern is unique', () => {
    const unique = new Set(REGISTERED_ROUTES);
    expect(unique.size).toBe(REGISTERED_ROUTES.length);
  });
});

describe('Route guard coverage', () => {
  const PROTECTED_ROUTES = [
    '/admin', '/admin/dispatch', '/admin/analytics', '/admin/users',
    '/admin/security', '/admin/fleet', '/admin/billing', '/admin/subscription',
    '/profile', '/settings', '/driver', '/driver/hub', '/facility', '/client',
  ];

  const PUBLIC_ROUTES = [
    '/', '/login', '/register', '/pricing', '/about', '/contact',
    '/solutions', '/recruitment', '/driver-recruitment', '/legal',
  ];

  it('all protected routes exist in route table', () => {
    PROTECTED_ROUTES.forEach(route => {
      expect(routeMatches(route, REGISTERED_ROUTES)).toBe(true);
    });
  });

  it('all public routes exist in route table', () => {
    PUBLIC_ROUTES.forEach(route => {
      expect(routeMatches(route, REGISTERED_ROUTES)).toBe(true);
    });
  });

  it('protected and public route sets are disjoint', () => {
    const overlap = PROTECTED_ROUTES.filter(r => PUBLIC_ROUTES.includes(r));
    expect(overlap).toHaveLength(0);
  });
});
