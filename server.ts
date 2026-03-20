import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { z } from "zod";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Validation Schemas ---
const IngestSchema = z.object({
  externalId: z.string().min(1, "externalId is required"),
  clientName: z.string().min(1, "clientName is required"),
  type: z.enum(["INBOUND", "OUTBOUND"]).optional(),
  address: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().positive(),
    unit: z.string()
  })).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
});

const TelemetrySchema = z.object({
  dnId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime().optional(),
  signature: z.string().min(1)
});

// Shared secret - must match frontend
const SECURITY_SECRET = process.env.SECURITY_SECRET || 'shipstack-default-secret-key-2026';

/**
 * Verifies the HMAC signature of a telemetry payload.
 */
const verifyTelemetrySignature = (data: any): boolean => {
  const { signature, ...payload } = data;
  if (!signature) return false;
  
  const message = JSON.stringify(payload);
  const expected = CryptoJS.HmacSHA256(message, SECURITY_SECRET).toString();
  return expected === signature;
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket']
  });

  const PORT = 3000;

  // Security Headers (XSS, CSRF protection, etc.)
  // app.use(helmet({
  //   frameguard: false, // Allow iframing for AI Studio preview
  //   contentSecurityPolicy: {
  //     directives: {
  //       ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  //       "img-src": ["'self'", "data:", "https:", "http:", "https://*.google.com"],
  //       "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  //       "connect-src": ["'self'", "https:", "http:", "wss:", "ws:", "https://*.google.com"],
  //       "frame-ancestors": ["'self'", "https://ai.studio", "https://*.google.com"]
  //     }
  //   }
  // }));

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' })); // Limit payload size

  // Response Caching Middleware for static-ish API responses
  const cacheMiddleware = (seconds: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${seconds}`);
    }
    next();
  };

  /**
   * API Ingestion Middleware (ISO 27001 A.12.4)
   * Validates Bearer tokens for external ERP integrations.
   */
  const apiAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        message: "Missing or invalid Authorization header. Expected 'Bearer <token>'" 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // In a production environment, we would validate this against a database.
    // For this platform reconstruction, we accept valid-formatted tokens.
    if (!token.startsWith('sk_live_') && !token.startsWith('SS_PUB_')) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Invalid API Key format or revoked token." 
      });
    }

    next();
  };

  // API Routes
  app.get("/api/health", cacheMiddleware(60), (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  /**
   * Inbound Ingestion Endpoint
   * Purpose: Standardized entry point for Client ERPs to push shipment requests.
   */
  app.post("/api/ingest", apiAuthMiddleware, (req, res) => {
    try {
      const payload = IngestSchema.parse(req.body);
      
      console.log(`[INGEST] Received shipment request: ${payload.externalId} from ${payload.clientName}`);

      // Emit to all connected clients (Admin Dashboard, etc.)
      const internalId = `dn-api-${Date.now()}`;
      io.emit("ingest:new", {
        ...payload,
        id: internalId,
        status: "RECEIVED",
        createdAt: new Date().toISOString(),
        logs: [{ id: Date.now().toString(), action: 'Ingested via API', notes: 'Automated ERP sync', user: 'System', timestamp: new Date().toISOString() }]
      });

      res.status(201).json({ 
        success: true, 
        message: "Shipment request accepted and queued for processing.",
        internalId
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation Error", 
          details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      throw err; // Pass to global error handler
    }
  });

  // Telemetry Endpoint (Proxy for Socket.io)
  app.post("/api/telemetry", (req, res) => {
    try {
      const data = TelemetrySchema.parse(req.body);
      
      if (!verifyTelemetrySignature(data)) {
        console.warn(`[SECURITY] Invalid telemetry signature received via HTTP for DN: ${data.dnId}`);
        return res.status(403).json({ error: "Forbidden", message: "Invalid telemetry signature." });
      }

      const { dnId, lat, lng, speed, heading, timestamp } = data;
      io.emit("telemetry:update", { dnId, lat, lng, speed, heading, timestamp: timestamp || new Date().toISOString() });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation Error", 
          details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      throw err;
    }
  });

  /**
   * M-Pesa STK Push Mock (Daraja API)
   * Purpose: Trigger a payment request on the user's phone.
   */
  app.post("/api/mpesa/stk-push", (req, res) => {
    const { phone, amount, reference } = req.body;
    console.log(`[M-PESA] Initiating STK Push for ${phone}, Amount: ${amount}, Ref: ${reference}`);
    
    // Simulate Daraja API response
    res.json({
      MerchantRequestID: `req-${Date.now()}`,
      CheckoutRequestID: `chk-${Date.now()}`,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing"
    });
  });

  /**
   * KRA eTIMS Mock
   * Purpose: Generate a tax-compliant invoice.
   */
  app.post("/api/etims/generate", (req, res) => {
    const { invoiceData } = req.body;
    console.log(`[eTIMS] Generating tax invoice for: ${invoiceData.externalId}`);
    
    res.json({
      cuInvoiceNumber: `KRA-INV-${Date.now()}`,
      qrCodeUrl: "https://kra.go.ke/verify/mock-qr",
      status: "SUCCESS"
    });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'production' ? "An unexpected error occurred." : err.message
    });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

    socket.on("telemetry:report", (data) => {
      if (!verifyTelemetrySignature(data)) {
        console.warn(`[SECURITY] Invalid telemetry signature received via Socket from ${socket.id} for DN: ${data.dnId}`);
        return;
      }
      
      // Broadcast to all other clients
      socket.broadcast.emit("telemetry:update", data);
    });

    socket.on("error", (err) => {
      console.error(`[SOCKET] Error for client ${socket.id}:`, err);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SOCKET] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
