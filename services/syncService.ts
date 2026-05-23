import { offlineDb, PendingUpdate } from './offlineDb';
import { api } from '../api';
import { useAppStore } from '../store';

export class SyncService {
  private isSyncing = false;
  private intervalId: number | null = null;
  private onlineListener = () => this.sync();

  async sync() {
    if (this.isSyncing) return;

    const isOnline = navigator.onLine;
    const pendingUpdates = await offlineDb.pendingUpdates.count();

    // Update store with current count even if offline
    useAppStore.getState().setSyncStatus({ pendingCount: pendingUpdates });

    if (!isOnline) return;

    this.isSyncing = true;
    useAppStore.getState().setSyncStatus({ isSyncing: true });
    console.log('Starting background sync...');

    try {
      const updates = await offlineDb.pendingUpdates.toArray();

      for (const update of updates) {
        try {
          await this.processUpdate(update);
          if (update.id) await offlineDb.pendingUpdates.delete(update.id);

          // Incrementally update pending count
          const currentCount = await offlineDb.pendingUpdates.count();
          useAppStore.getState().setSyncStatus({ pendingCount: currentCount });
        } catch (error) {
          console.error(`Failed to sync update ${update.id}:`, error);
        }
      }

      if (updates.length > 0) {
        useAppStore.getState().addNotification(`Synchronized ${updates.length} offline updates.`, 'success');
        useAppStore.getState().setSyncStatus({ lastSyncTime: new Date().toISOString() });
      }
    } finally {
      this.isSyncing = false;
      useAppStore.getState().setSyncStatus({ isSyncing: false });
    }
  }

  private async processUpdate(update: PendingUpdate) {
    switch (update.type) {
      case 'DN_STATUS':
        await api.updateDNStatus(update.targetId, update.data.status, update.data.metadata, update.data.userName);
        break;
      case 'TRIP_STATUS':
        // update.data may carry a full Trip patch or just { status }
        await api.updateTrip(update.targetId, update.data);
        break;
      case 'TELEMETRY':
        await api.saveTelemetryPing(update.data);
        break;
      case 'EMERGENCY':
        await api.logSafetyEvent(update.targetId, update.data.type, update.data.severity, update.data.metadata);
        break;
      case 'CLOCK_IN':
        await api.clockIn(update.targetId);
        break;
      case 'CLOCK_OUT':
        await api.clockOut(update.targetId);
        break;
      case 'INSPECTION':
        await api.saveInspection(update.data);
        break;
      default:
        console.warn('Unknown update type:', update.type);
    }
  }

  startAutoSync() {
    window.removeEventListener('online', this.onlineListener);
    window.addEventListener('online', this.onlineListener);

    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => this.sync(), 60000);
    this.sync(); // Initial sync
  }

  stopAutoSync() {
    window.removeEventListener('online', this.onlineListener);
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const syncService = new SyncService();

/**
 * Run an action online; on failure or when offline, enqueue it for later sync.
 *
 * Returns the online result when it succeeds, or `undefined` when the work was
 * queued. Use this for fire-and-forget driver actions (clock in/out, inspection)
 * where the offline UX is "apply locally, sync when reconnected".
 */
export async function runOrQueue(
  onlineFn: () => Promise<unknown>,
  fallback: Omit<PendingUpdate, 'id' | 'timestamp'>,
): Promise<{ queued: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await offlineDb.addPendingUpdate(fallback);
    return { queued: true };
  }
  try {
    await onlineFn();
    return { queued: false };
  } catch (err) {
    console.warn('Online action failed, queuing for offline sync:', err);
    await offlineDb.addPendingUpdate(fallback);
    return { queued: true };
  }
}
