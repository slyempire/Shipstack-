import { frappe_realtime } from "./frappe-realtime";
import { useAuthStore } from "../store";

export const telemetryService = {
  connect() {
    frappe_realtime.connect();
  },

  async emitTelemetry(dnId: string, lat: number, lng: number, speed?: number, heading?: number) {
    const payload = {
      dnId,
      lat,
      lng,
      speed,
      heading,
      timestamp: new Date().toISOString(),
    };

    // Telemetry is sent via HTTP POST to Node proxy which will save to Frappe
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("HTTP Telemetry failed");
      
      return;
    } catch (err) {
      console.error("Telemetry Fallback Error, queuing for offline sync:", err);
      this.queueOfflinePoint(payload);
    }
  },

  queueOfflinePoint(point: any) {
    try {
      const queue = JSON.parse(localStorage.getItem('shipstack_telemetry_queue') || '[]');
      queue.push(point);
      // Keep queue size reasonable
      if (queue.length > 1000) queue.shift();
      localStorage.setItem('shipstack_telemetry_queue', JSON.stringify(queue));
    } catch (err) {
      console.error("Failed to queue offline telemetry", err);
    }
  },

  async syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('shipstack_telemetry_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`[OFFLINE] Syncing ${queue.length} telemetry points...`);
    
    const remaining = [];
    for (const point of queue) {
      try {
        const response = await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point)
        });
        if (!response.ok) throw new Error("Sync failed");
      } catch (err) {
        remaining.push(point);
      }
    }

    localStorage.setItem('shipstack_telemetry_queue', JSON.stringify(remaining));
  },

  onTelemetryUpdate(callback: (data: any) => void) {
    frappe_realtime.subscribe("shipstack_telemetry");
    frappe_realtime.on("telemetry:update", callback);
  },

  onIngestNew(callback: (data: any) => void) {
    frappe_realtime.subscribe("shipstack_ingest");
    frappe_realtime.on("ingest:new", callback);
  },

  disconnect() {
    frappe_realtime.disconnect();
  }
};
