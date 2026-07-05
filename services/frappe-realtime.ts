import { io, Socket } from "socket.io-client";

export const frappe_realtime = {
  socket: null as Socket | null,
  
  connect(url?: string) {
    if (this.socket?.connected) return;
    
    // In local docker setup, Frappe runs Socket.io on port 9000.
    // In production/VPS, Nginx proxies /socket.io to 9000, so we can connect to window.location.origin.
    let socketUrl = url;
    if (!socketUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:9000';
      } else {
        socketUrl = window.location.origin;
      }
    }
    
    this.socket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
    
    this.socket.on("connect", () => {
      console.log("Frappe Realtime Socket Connected:", this.socket?.id);
    });
    
    this.socket.on("connect_error", (err) => {
      console.warn("Frappe Realtime Socket Connection Error:", err);
    });
  },
  
  subscribe(room: string) {
    if (!this.socket) this.connect();
    // Join a room (Frappe standard: emit 'subscribe' with room name)
    this.socket?.emit("subscribe", room);
  },
  
  unsubscribe(room: string) {
    this.socket?.emit("unsubscribe", room);
  },
  
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  },
  
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  },
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
};
