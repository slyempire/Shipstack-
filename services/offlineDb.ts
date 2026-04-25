import Dexie, { Table } from 'dexie';
import { DeliveryNote, Trip } from '../types';
import DOMPurify from 'dompurify';

export interface PendingUpdate {
  id?: number;
  type: 'DN_STATUS' | 'TRIP_STATUS' | 'TELEMETRY' | 'EMERGENCY';
  targetId: string;
  payload: any;
  retries: number;
  timestamp: string;
}

export class OfflineDB extends Dexie {
  deliveryNotes!: Table<DeliveryNote>;
  trips!: Table<Trip>;
  pendingUpdates!: Table<PendingUpdate>;

  constructor() {
    super('ShipstackOfflineDB');
    this.version(2).stores({
      deliveryNotes: 'id, status, driverId, tenantId',
      trips: 'id, status, driverId, tenantId',
      pendingUpdates: '++id, type, targetId, timestamp, retries',
    });
  }

  private sanitize(data: any): any {
    if (typeof data === 'string') return DOMPurify.sanitize(data);
    if (Array.isArray(data)) return data.map(i => this.sanitize(i));
    if (data !== null && typeof data === 'object') {
      return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, this.sanitize(v)]));
    }
    return data;
  }

  async seedDeliveryNotes(dns: DeliveryNote[]): Promise<void> {
    await this.deliveryNotes.bulkPut(dns);
  }

  async getDeliveryNotes(driverId: string): Promise<DeliveryNote[]> {
    return this.deliveryNotes.where('driverId').equals(driverId).toArray();
  }

  async putDeliveryNote(dn: DeliveryNote): Promise<void> {
    await this.deliveryNotes.put(dn);
  }

  async queueUpdate(type: PendingUpdate['type'], targetId: string, payload: any): Promise<void> {
    await this.pendingUpdates.add({
      type,
      targetId,
      payload: this.sanitize(payload),
      retries: 0,
      timestamp: new Date().toISOString(),
    });
  }

  async getPendingUpdates(): Promise<PendingUpdate[]> {
    return this.pendingUpdates.orderBy('timestamp').toArray();
  }

  async markUpdateProcessed(id: number): Promise<void> {
    await this.pendingUpdates.delete(id);
  }

  async incrementRetry(id: number): Promise<void> {
    const update = await this.pendingUpdates.get(id);
    if (update) await this.pendingUpdates.put({ ...update, retries: update.retries + 1 });
  }

  async clearStalePendingUpdates(maxRetries = 5): Promise<number> {
    const stale = await this.pendingUpdates.filter(u => u.retries >= maxRetries).toArray();
    await this.pendingUpdates.bulkDelete(stale.map(u => u.id!));
    return stale.length;
  }
}

export const offlineDb = new OfflineDB();

// ─── Background sync ──────────────────────────────────────────────────────
// Called when connectivity is restored. Drains the pendingUpdates queue.
export async function flushPendingUpdates(
  onFlush: (update: PendingUpdate) => Promise<void>
): Promise<{ flushed: number; failed: number }> {
  const updates = await offlineDb.getPendingUpdates();
  let flushed = 0;
  let failed = 0;

  for (const update of updates) {
    try {
      await onFlush(update);
      await offlineDb.markUpdateProcessed(update.id!);
      flushed++;
    } catch {
      await offlineDb.incrementRetry(update.id!);
      failed++;
    }
  }

  // Discard permanently failed updates (too many retries)
  await offlineDb.clearStalePendingUpdates();
  return { flushed, failed };
}
