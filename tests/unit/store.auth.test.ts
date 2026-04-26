import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Reset Zustand store between tests by re-importing and setting state directly
let useAuthStore: any;

beforeEach(async () => {
  // Dynamic import to get a fresh module reference each time
  vi.resetModules();
  const mod = await import('../../store');
  useAuthStore = mod.useAuthStore;
  // Reset to initial state
  act(() => {
    useAuthStore.getState().logout();
  });
});

import { vi } from 'vitest';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('useAuthStore — login / logout', () => {
  const mockUser: any = {
    id: 'user-1',
    name: 'Test Admin',
    email: 'admin@shipstack.com',
    role: 'ADMIN',
    systemRole: 'tenant_admin',
    isOnboarded: true,
  };

  it('starts unauthenticated', () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
  });

  it('sets user and token on login', () => {
    act(() => {
      useAuthStore.getState().login(mockUser, 'token-abc');
    });
    const { isAuthenticated, user, token } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.name).toBe('Test Admin');
    expect(token).toBe('token-abc');
  });

  it('clears user and token on logout', () => {
    act(() => {
      useAuthStore.getState().login(mockUser, 'token-abc');
      useAuthStore.getState().logout();
    });
    const { isAuthenticated, user, token } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('updateUser merges partial updates', () => {
    act(() => {
      useAuthStore.getState().login(mockUser, 'tok');
      useAuthStore.getState().updateUser({ name: 'Updated Name' });
    });
    const { user } = useAuthStore.getState();
    expect(user?.name).toBe('Updated Name');
    expect(user?.email).toBe('admin@shipstack.com'); // unchanged
  });
});

describe('useAuthStore — hasPermission', () => {
  it('returns true for super_admin on any permission', () => {
    act(() => {
      useAuthStore.getState().login({ role: 'super_admin' } as any, 'tok');
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('analytics:all')).toBe(true);
    expect(hasPermission('trips:delete')).toBe(true);
  });

  it('returns false when not logged in', () => {
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('dashboard:view')).toBe(false);
  });

  it('grants dispatcher dispatch and denies billing', () => {
    act(() => {
      useAuthStore.getState().login({ role: 'dispatcher' } as any, 'tok');
    });
    const { hasPermission } = useAuthStore.getState();
    expect(hasPermission('dispatch:assign')).toBe(true);
    expect(hasPermission('billing:all')).toBe(false);
  });
});

describe('useAuthStore — currentUserRole', () => {
  it('derives role from user.role field', () => {
    act(() => {
      useAuthStore.getState().login({ role: 'dispatcher' } as any, 'tok');
    });
    expect(useAuthStore.getState().currentUserRole).toBe('dispatcher');
  });

  it('falls back to client when role is absent', () => {
    act(() => {
      useAuthStore.getState().login({ name: 'No Role' } as any, 'tok');
    });
    expect(useAuthStore.getState().currentUserRole).toBe('client');
  });
});
