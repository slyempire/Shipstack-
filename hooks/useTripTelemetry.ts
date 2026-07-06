
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { TelemetryPoint, DNStatus } from '../types';
import { useAppStore } from '../store';

// Audit: Set to 15s (10-20s range) to balance battery life and real-time tracking
const TELEMETRY_INTERVAL = 15000; 

export const useTripTelemetry = (tripId: string | undefined, enabled: boolean) => {
  const { isOnline } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const lastPingAt = useRef<number>(0);
  const watchId = useRef<number | null>(null);
  const syncInFlight = useRef(false);

  // Flush the offline queue when connectivity (re)appears. Background sync
  // is silent — no toast on success; failures retry on the next transition.
  // syncInFlight guards re-entry; `syncing` must NOT be an effect dependency
  // (it re-armed the effect on completion, causing an endless sync/toast loop).
  useEffect(() => {
    if (!isOnline || syncInFlight.current) return;
    syncInFlight.current = true;
    setSyncing(true);
    api.syncOfflineTelemetry()
      .catch(() => console.debug('Telemetry sync deferred.'))
      .finally(() => {
        syncInFlight.current = false;
        setSyncing(false);
      });
  }, [isOnline]);

  useEffect(() => {
    if (!enabled || !tripId || !navigator.geolocation) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    const handlePosition = async (pos: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastPingAt.current < TELEMETRY_INTERVAL) return;

      try {
        await api.updateTelemetry(tripId, pos.coords.latitude, pos.coords.longitude);
      } catch (err) {
        console.warn("Telemetry update failed, will retry later.");
      }

      lastPingAt.current = now;
    };

    watchId.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        console.warn("GPS Signal Weak or Error:", { code: err.code, message: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled, tripId, isOnline]);

  return { syncing };
};
