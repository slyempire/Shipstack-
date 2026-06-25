
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { TelemetryPoint, DNStatus } from '../types';
import { useAppStore } from '../store';

// Audit: Set to 15s (10-20s range) to balance battery life and real-time tracking
const TELEMETRY_INTERVAL = 15000; 

export const useTripTelemetry = (tripId: string | undefined, enabled: boolean) => {
  const { isOnline, addNotification } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const lastPingAt = useRef<number>(0);
  const watchId = useRef<number | null>(null);

  // Flush any queued offline telemetry when we (re)gain connectivity. Depends
  // only on `isOnline` — the previous version also depended on `syncing`, which
  // it set itself, creating a re-render loop that re-synced and fired the
  // "synced" toast on every cycle. We now run once per online transition and
  // only notify when points were actually flushed.
  useEffect(() => {
    if (!isOnline || syncingRef.current) return;
    let cancelled = false;
    const sync = async () => {
      syncingRef.current = true;
      setSyncing(true);
      try {
        const synced = await api.syncOfflineTelemetry();
        if (!cancelled && synced > 0) {
          addNotification(`Synced ${synced} offline location${synced === 1 ? '' : 's'}.`, 'success');
        }
      } catch (err) {
        console.debug("Telemetry sync deferred.");
      } finally {
        syncingRef.current = false;
        if (!cancelled) setSyncing(false);
      }
    };
    sync();
    return () => { cancelled = true; };
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
