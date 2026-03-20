import { offlineDb, PendingUpdate } from './offlineDb';
import { api } from '../api';
import { useAppStore } from '../store';

export class SyncService {
  private isSyncing = false;

  async sync() {
    if (this.isSyncing) return;
    
    const isOnline = navigator.onLine;
    if (!isOnline) return;

    this.isSyncing = true;
    console.log('Starting background sync...');

    try {
      const updates = await offlineDb.pendingUpdates.toArray();
      
      for (const update of updates) {
        try {
          await this.processUpdate(update);
          if (update.id) await offlineDb.pendingUpdates.delete(update.id);
        } catch (error) {
          console.error(`Failed to sync update ${update.id}:`, error);
          // If it's a permanent error, we might want to discard it, 
          // but for now we'll keep it to retry later.
        }
      }
      
      if (updates.length > 0) {
        useAppStore.getState().addNotification(`Synchronized ${updates.length} offline updates.`, 'success');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async processUpdate(update: PendingUpdate) {
    switch (update.type) {
      case 'DN_STATUS':
        await api.updateDNStatus(update.targetId, update.data.status, update.data.metadata, update.data.userName);
        break;
      case 'TELEMETRY':
        await api.saveTelemetryPing(update.data);
        break;
      case 'EMERGENCY':
        await api.logSafetyEvent(update.targetId, update.data.type, update.data.severity, update.data.metadata);
        break;
      default:
        console.warn('Unknown update type:', update.type);
    }
  }

  startAutoSync() {
    window.addEventListener('online', () => this.sync());
    // Also poll occasionally just in case
    setInterval(() => this.sync(), 60000);
    this.sync(); // Initial sync
  }
}

export const syncService = new SyncService();
