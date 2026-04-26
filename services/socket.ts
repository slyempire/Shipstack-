import { io, Socket } from "socket.io-client";
import { signPayload } from "../utils/security";

let socket: Socket | null = null;

const getTelemetrySocketUrl = () => {
  if (import.meta.env.VITE_TELEMETRY_SOCKET_URL) {
    return import.meta.env.VITE_TELEMETRY_SOCKET_URL;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `${window.location.protocol}//${host}:3000`;
  }

  return 'http://localhost:3000';
};

export const telemetryService = {
  connect() {
    if (socket?.connected) return;

    const socketUrl = getTelemetrySocketUrl();

    socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io',
      autoConnect: true
    });

    socket.on("connect", () => {
      console.log("Telemetry Socket Connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("Telemetry Socket Connection Error, falling back to HTTP:", err?.message || err);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`Telemetry reconnect attempt ${attempt}`);
    });

    socket.on('reconnect_failed', () => {
      console.warn('Telemetry reconnect failed. Falling back to HTTP transport.');
    });

    socket.on('disconnect', (reason) => {
      console.warn('Telemetry socket disconnected:', reason);
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
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
