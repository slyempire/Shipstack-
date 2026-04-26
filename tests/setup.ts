import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env for all tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SECURITY_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
    MODE: 'test',
    DEV: false,
    PROD: false,
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost', search: '', host: 'localhost', href: 'http://localhost/' },
  writable: true,
});

// Suppress console.warn/error noise in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
