/**
 * Client-side error monitoring (Sentry), gated by VITE_SENTRY_DSN.
 *
 * The SDK is loaded with a dynamic import so accounts without a DSN pay
 * zero bundle/runtime cost. captureError buffers nothing — it silently
 * no-ops until (and unless) the SDK finishes loading.
 */

let sentry: typeof import('@sentry/react') | null = null;

export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  import('@sentry/react')
    .then(S => {
      S.init({
        dsn,
        // Keep the client config lean: errors only, light sampling on
        // traces. Raise via env when there's traffic worth profiling.
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        environment: import.meta.env.MODE,
      });
      sentry = S;
    })
    .catch(err => console.warn('Sentry failed to load:', err));
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!sentry) return;
  sentry.captureException(error, context ? { extra: context } : undefined);
}
