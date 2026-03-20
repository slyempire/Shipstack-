import Dexie, { Table } from 'dexie';
import { DeliveryNote, Trip } from '../types';
import DOMPurify from 'dompurify';

export interface PendingUpdate {
  id?: number;
  type: 'DN_STATUS' | 'TRIP_STATUS' | 'TELEMETRY' | 'EMERGENCY';
  targetId: string;
  data: any;
  timestamp: string;
}

export class OfflineDB extends Dexie {
  deliveryNotes!: Table<DeliveryNote>;
  trips!: Table<Trip>;
  pendingUpdates!: Table<PendingUpdate>;

  constructor() {
    super('ShipstackOfflineDB');
    this.version(1).stores({
      deliveryNotes: 'id, status, driverId',
      trips: 'id, status, driverId',
      pendingUpdates: '++id, type, targetId, timestamp'
    });
  }

  // Security: Sanitize data before storing
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return DOMPurify.sanitize(data);
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = this.sanitizeData(data[key]);
      }
      return sanitized;
    }
    return data;
  }

  async addPendingUpdate(update: Omit<PendingUpdate, 'id' | 'timestamp'>) {
    const sanitizedData = this.sanitizeData(update.data);
    return await this.pendingUpdates.add({
      ...update,
      data: sanitizedData,
      timestamp: new Date().toISOString()
    });
  }
}

export const offlineDb = new OfflineDB();
