/**
 * Consent-gated analytics for the public marketing pages.
 *
 * Loads Google Analytics 4 only when BOTH are true:
 *  - VITE_GA_MEASUREMENT_ID is set at build time
 *  - the visitor accepted the cookie banner
 *
 * The in-app experience (admin/driver/facility portals) never calls this;
 * only MarketingLayout does.
 */

export const CONSENT_STORAGE_KEY = 'shipstack_cookie_consent';

export type ConsentChoice = 'accepted' | 'declined';

export function getConsent(): ConsentChoice | null {
  const value = localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setConsent(choice: ConsentChoice): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  if (choice === 'accepted') initAnalytics();
}

let loaded = false;

export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (loaded || !measurementId || getConsent() !== 'accepted') return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  const w = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag(...args: unknown[]) { w.dataLayer!.push(args); };
  w.gtag('js', new Date());
  // anonymize_ip: minimize personal data collected under the DPA/GDPR
  w.gtag('config', measurementId, { anonymize_ip: true });
}
