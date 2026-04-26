import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import type { Tenant } from '../../types';

const makeTenant = (currency: string): Partial<Tenant> => ({
  settings: { currency, timezone: 'Africa/Nairobi', primaryColor: '#0F2A44' },
});

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats KES amounts with Kenyan locale', () => {
    const result = formatCurrency(1000, makeTenant('KES') as Tenant);
    expect(result).toContain('1,000');
  });

  it('formats USD amounts', () => {
    const result = formatCurrency(2500, makeTenant('USD') as Tenant);
    expect(result).toContain('2,500');
    expect(result).toContain('$');
  });

  it('defaults to KES when tenant is null', () => {
    const result = formatCurrency(500, null);
    expect(result).toContain('500');
  });

  it('defaults to KES when tenant has no settings', () => {
    const result = formatCurrency(750, {} as Tenant);
    expect(result).toContain('750');
  });

  it('returns zero-formatted amount for 0', () => {
    const result = formatCurrency(0, makeTenant('KES') as Tenant);
    expect(result).toContain('0');
  });

  it('formats large amounts without decimal places', () => {
    const result = formatCurrency(1_000_000, makeTenant('KES') as Tenant);
    expect(result).not.toContain('.');
  });

  it('handles negative amounts', () => {
    const result = formatCurrency(-100, makeTenant('USD') as Tenant);
    expect(result).toContain('100');
  });
});

describe('getCurrencySymbol', () => {
  it('returns KSh for KES', () => {
    expect(getCurrencySymbol(makeTenant('KES') as Tenant)).toBe('KSh');
  });

  it('returns $ for USD', () => {
    expect(getCurrencySymbol(makeTenant('USD') as Tenant)).toBe('$');
  });

  it('returns € for EUR', () => {
    expect(getCurrencySymbol(makeTenant('EUR') as Tenant)).toBe('€');
  });

  it('returns £ for GBP', () => {
    expect(getCurrencySymbol(makeTenant('GBP') as Tenant)).toBe('£');
  });

  it('returns currency code as fallback for unknown currencies', () => {
    expect(getCurrencySymbol(makeTenant('NGN') as Tenant)).toBe('NGN');
  });

  it('defaults to KSh when tenant is undefined', () => {
    expect(getCurrencySymbol(undefined)).toBe('KSh');
  });

  it('defaults to KSh when tenant is null', () => {
    expect(getCurrencySymbol(null)).toBe('KSh');
  });
});
