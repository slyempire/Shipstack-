import { io, Socket } from "socket.io-client";
import { signPayload } from "../utils/security";
import { useAuthStore } from "../store";

let socket: Socket | null = null;

export const telemetryService = {
  connect() {
    if (socket?.connected) return;

    const token = useAuthStore.getState().token;

    // Standard socket connection with auth token
    socket = io({
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socket.on("connect", () => {
      console.log("Telemetry Socket Connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      // Only log as warning if we haven't given up yet
      if (socket && !socket.active) {
         console.warn("Telemetry Socket Connection Failed. Ensure server.ts is running and reachable.");
      } else {
         console.log("Telemetry Socket attempting connection...");
      }
    });
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

    // Sign the payload for integrity
    const signature = signPayload(payload);
    const signedData = { ...payload, signature };

    // Try socket first if connected
    if (socket?.connected) {
      socket.emit("telemetry:report", signedData);
      return;
    }

    // Fallback to HTTP POST
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(signedData)
      });
      
      if (!response.ok) throw new Error("HTTP Telemetry failed");
      
      return;
    } catch (err) {
      console.error("Telemetry Fallback Error, queuing for offline sync:", err);
      this.queueOfflinePoint(signedData);
    }
    
    // Attempt to reconnect socket in background
    if (!socket || !socket.connected) {
      this.connect();
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
    if (!socket) this.connect();
    socket?.on("telemetry:update", callback);
  },

  onIngestNew(callback: (data: any) => void) {
    if (!socket) this.connect();
    socket?.on("ingest:new", callback);
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  }
};
