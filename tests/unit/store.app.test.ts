import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { act } from '@testing-library/react';

let useAppStore: any;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../store');
  useAppStore = mod.useAppStore;
});

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('useAppStore — notifications', () => {
  it('addNotification creates a notification with id and timestamp', () => {
    act(() => {
      useAppStore.getState().addNotification('Hello', 'success');
    });
    const { notifications } = useAppStore.getState();
    const n = notifications.find((x: any) => x.message === 'Hello');
    expect(n).toBeDefined();
    expect(n.type).toBe('success');
    expect(n.id).toBeTruthy();
    expect(n.timestamp).toBeTruthy();
  });

  it('supports all notification types', () => {
    const types = ['success', 'error', 'info', 'warning'] as const;
    types.forEach(type => {
      act(() => {
        useAppStore.getState().addNotification(`msg-${type}`, type);
      });
    });
    const { notifications } = useAppStore.getState();
    types.forEach(type => {
      expect(notifications.some((n: any) => n.type === type)).toBe(true);
    });
  });

  it('markRead marks a notification as read (not removed)', () => {
    act(() => {
      useAppStore.getState().addNotification('To mark', 'info');
    });
    const { notifications } = useAppStore.getState();
    const target = notifications.find((n: any) => n.message === 'To mark');
    expect(target).toBeDefined();
    expect(target.read).toBeFalsy();

    act(() => {
      useAppStore.getState().markRead(target.id);
    });
    const after = useAppStore.getState().notifications;
    const marked = after.find((n: any) => n.id === target.id);
    expect(marked).toBeDefined();
    expect(marked.read).toBe(true);
  });

  it('dismissNotification removes notification by id', () => {
    act(() => {
      useAppStore.getState().addNotification('To dismiss', 'error');
    });
    const { notifications } = useAppStore.getState();
    const id = notifications.find((n: any) => n.message === 'To dismiss')?.id;
    expect(id).toBeTruthy();

    act(() => {
      useAppStore.getState().dismissNotification(id);
    });
    const after = useAppStore.getState().notifications;
    expect(after.find((n: any) => n.id === id)).toBeUndefined();
  });

  it('accumulates multiple notifications', () => {
    act(() => {
      useAppStore.getState().addNotification('A', 'success');
      useAppStore.getState().addNotification('B', 'error');
      useAppStore.getState().addNotification('C', 'info');
    });
    const { notifications } = useAppStore.getState();
    const msgs = notifications.map((n: any) => n.message);
    expect(msgs).toContain('A');
    expect(msgs).toContain('B');
    expect(msgs).toContain('C');
  });
});

describe('useAppStore — online state', () => {
  it('defaults to online', () => {
    expect(useAppStore.getState().isOnline).toBe(true);
  });

  it('setIsOnline updates state', () => {
    act(() => {
      useAppStore.getState().setIsOnline(false);
    });
    expect(useAppStore.getState().isOnline).toBe(false);
    act(() => {
      useAppStore.getState().setIsOnline(true);
    });
    expect(useAppStore.getState().isOnline).toBe(true);
  });
});
