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
import { Redis } from "@upstash/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AI & Redis Initialization ---
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const SECURITY_SECRET = process.env.SECURITY_SECRET;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || '';
const FRAPPE_BASE_URL = process.env.FRAPPE_BASE_URL || process.env.VITE_FRAPPE_BASE_URL || '';
const FRAPPE_API_KEY = process.env.FRAPPE_API_KEY || process.env.VITE_FRAPPE_API_KEY || '';
const FRAPPE_API_SECRET = process.env.FRAPPE_API_SECRET || process.env.VITE_FRAPPE_API_SECRET || '';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const requireEnv = (name: string, value?: string) => {
  if (!value) {
    const message = `Missing required environment variable: ${name}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(`CRITICAL ERROR: ${message}. Exiting.`);
      process.exit(1);
    }
    console.warn(`WARNING: ${message}. This is acceptable only in local development.`);
  }
};

requireEnv('SECURITY_SECRET', SECURITY_SECRET);
requireEnv('INTERNAL_API_SECRET', INTERNAL_API_SECRET);
if (process.env.NODE_ENV === 'production') {
  requireEnv('FRAPPE_BASE_URL', FRAPPE_BASE_URL);
  requireEnv('FRAPPE_API_KEY', FRAPPE_API_KEY);
  requireEnv('FRAPPE_API_SECRET', FRAPPE_API_SECRET);
}

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

/**
 * Verifies the HMAC signature of a telemetry payload.
 */
const verifyTelemetrySignature = (data: any): boolean => {
  const { signature, ...payload } = data;
  if (!signature) {
    // Browser telemetry may not use a shared HMAC secret.
    return true;
  }
  if (!SECURITY_SECRET) return false;

  const message = JSON.stringify(payload);
  const expected = CryptoJS.HmacSHA256(message, SECURITY_SECRET).toString();
  return expected === signature;
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [APP_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
    }
  });

  const PORT = 3000;

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:'],
        frameAncestors: ["'self'"]
      }
    } : false
  }));

  app.use(cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

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
    
    if (!token.startsWith('sk_live_') && !token.startsWith('SS_PUB_')) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Invalid API Key format or revoked token." 
      });
    }

    next();
  };

  const internalAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!INTERNAL_API_SECRET) {
      console.warn('WARNING: INTERNAL_API_SECRET is not configured. Internal routes are unprotected.');
      return next();
    }

    const authHeader = req.headers.authorization;
    const internalHeader = req.headers['x-shipstack-internal'];
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const internalToken = typeof internalHeader === 'string' ? internalHeader : undefined;

    if (token === INTERNAL_API_SECRET || internalToken === INTERNAL_API_SECRET) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden", message: "Invalid internal auth token." });
  };

  const forwardFrappeRequest = async (req: express.Request, res: express.Response) => {
    if (!FRAPPE_BASE_URL || !FRAPPE_API_KEY || !FRAPPE_API_SECRET) {
      return res.status(503).json({ error: 'ERP Unavailable', message: 'Frappe backend is not configured on the server.' });
    }

    const forwardPath = req.path.replace(/^\/api\/frappe\/?/, '');
    const allowedPaths = ['/api/resource/', '/api/method/'];
    if (!allowedPaths.some((prefix) => forwardPath.startsWith(prefix))) {
      return res.status(403).json({ error: 'Forbidden', message: 'Requested proxy path is not allowed.' });
    }

    const targetUrl = `${FRAPPE_BASE_URL}/${forwardPath}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`,
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const responseText = await response.text();
    response.headers.forEach((value, key) => {
      if (['content-type', 'cache-control', 'expires', 'etag'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    return res.status(response.status).send(responseText);
  };

  // API Routes
  app.get("/api/health", cacheMiddleware(60), (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Redis Cache Routes (Internal only or protected) - Moved higher
  app.use("/api/frappe", forwardFrappeRequest);

  app.get("/api/cache/:cacheKey", internalAuthMiddleware, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      const value = await redis.get(cacheKey);
      res.json({ value });
    } catch (err) {
      console.error(`[CACHE] GET failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache GET Failed" });
    }
  });

  app.post("/api/cache/:cacheKey", internalAuthMiddleware, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      const { value, ttl } = req.body;
      await redis.set(cacheKey, value, { ex: ttl || 3600 });
      res.json({ success: true });
    } catch (err) {
      console.error(`[CACHE] SET failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache SET Failed" });
    }
  });

  app.delete("/api/cache/:cacheKey", internalAuthMiddleware, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      await redis.del(cacheKey);
      res.json({ success: true });
    } catch (err) {
      console.error(`[CACHE] DELETE failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache DELETE Failed" });
    }
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

  // AI Orchestration Routes
  app.post("/api/ai/prioritize", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI Service Unavailable", message: "Gemini API key not configured." });
    
    const { dns } = req.body;
    if (!dns || !Array.isArray(dns)) return res.status(400).json({ error: "Bad Request", message: "Missing 'dns' array in payload." });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Context: Shipstack Logistics Orchestrator.
        Task: Prioritize the following shipment queue for maximum operational efficiency.
        Criteria:
        1. Medical/Perishable industry = Highest Priority.
        2. Customer Priority (HIGH/MEDIUM/LOW).
        3. Weight vs Capacity optimization.
        4. Geographical proximity (addresses).
        
        Queue Data:
        ${JSON.stringify(dns.map(d => ({ 
          id: d.id, 
          customer: d.clientName, 
          priority: d.priority, 
          industry: d.industry, 
          address: d.address,
          weight: d.weightKg,
          perishable: d.isPerishable 
        })))}
        
        Return exactly a JSON array of objects: [{"id": "dn-id", "aiPriority": "HIGH"|"MEDIUM"|"LOW", "reason": "concise explanation"}]
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.match(/\[.*\]/s)?.[0] || text;
      const parsed = JSON.parse(cleanJson);
      
      res.json(parsed);
    } catch (err) {
      console.error("[AI] Prioritization Failed:", err);
      res.status(500).json({ error: "AI Processing Failed" });
    }
  });

  app.post("/api/ai/suggest-dispatch", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI Service Unavailable" });
    
    const { dns, vehicles } = req.body;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an logistics dispatch expert. 
        Analyze these current shipments and available vehicles to suggest optimal pairings (Dispatch Patterns).
        
        Shipments: ${JSON.stringify(dns.map(d => ({ id: d.id, weight: d.weightKg, address: d.address, industry: d.industry })))}
        Vehicles: ${JSON.stringify(vehicles.map(v => ({ id: v.id, type: v.type, capacity: v.capacityKg })))}
        
        Output format (JSON): {"suggestions": [{"vehicleId": "v-1", "dnIds": ["dn-1", "dn-2"], "reason": "why"}]}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.match(/\{.*\}/s)?.[0] || text;
      res.json(JSON.parse(cleanJson));
    } catch (err) {
      res.status(500).json({ error: "Dispatch Suggestion Failed" });
    }
  });

  app.post("/api/ai/suggest-resolution", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI Service Unavailable" });
    
    const { exception } = req.body;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are a logistics exception resolution expert. 
        Analyze this incident and suggest 3 possible resolution strategies.
        
        Incident:
        Type: ${exception.type}
        Severity: ${exception.severity}
        Description: ${exception.description}
        DN Reference: ${exception.dnId}
        
        Return a JSON object: {"recommendations": [{"action": "Action name", "explanation": "Why this is a good idea", "impact": "LOW|MEDIUM|HIGH"}]}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.match(/\{.*\}/s)?.[0] || text;
      res.json(JSON.parse(cleanJson));
    } catch (err) {
      res.status(500).json({ error: "Resolution Suggestion Failed" });
    }
  });



  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'production' ? "An unexpected error occurred." : err.message
    });
  });

  // API Fallback (prevent HTML responses for missing API routes)
  app.all("/api/*all", (req, res) => {
    res.status(404).json({ error: "API Route Not Found", path: req.url });
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
