
import { Tenant } from '../types';

export const formatCurrency = (amount: number, tenant?: Tenant | null) => {
  const currency = tenant?.settings?.currency || 'KES';
  const locale = currency === 'KES' ? 'en-KE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getCurrencySymbol = (tenant?: Tenant | null) => {
  const currency = tenant?.settings?.currency || 'KES';
  if (currency === 'KES') return 'KSh';
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '€';
  if (currency === 'GBP') return '£';
  return currency;
};
