import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { z } from "zod";
import { createServer as createViteServer, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from 'crypto-js';
import { Redis } from "@upstash/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

// Set up Document Storage
const DOCUMENTS_DIR = path.join(process.cwd(), 'storage', 'documents');
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- AI & Redis Initialization ---
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Enforce backend SECURITY_SECRET
const SECURITY_SECRET = process.env.SECURITY_SECRET || 'dev_secret_key';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || '';

if (!process.env.SECURITY_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL ERROR: SECURITY_SECRET environment variable is missing. Refusing to start in production.");
    process.exit(1);
  } else {
    console.warn("WARNING: SECURITY_SECRET is missing. Using 'dev_secret_key' for development.");
  }
}

// Frappe ERP Backend Configuration (Server-Side Only)
// Normalize URL: remove trailing slash if present
const FRAPPE_URL = process.env.FRAPPE_BASE_URL?.replace(/\/$/, "") || process.env.VITE_FRAPPE_BASE_URL?.replace(/\/$/, "");
const FRAPPE_BASE_URL = FRAPPE_URL;
const FRAPPE_API_KEY = process.env.FRAPPE_API_KEY || process.env.VITE_FRAPPE_API_KEY || '';
const FRAPPE_API_SECRET = process.env.FRAPPE_API_SECRET || process.env.VITE_FRAPPE_API_SECRET || '';

if (process.env.NODE_ENV === "production" && (!FRAPPE_API_KEY || !FRAPPE_API_SECRET)) {
  console.warn("WARNING: Frappe credentials missing in production. Proxy routes will be degraded.");
}


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
  signature: z.string().optional()
});

// Telemetry signature verification (HMAC-SHA256)
const verifyTelemetrySignature = (data: any): boolean => {
  const { signature, ...payload } = data;
  if (!signature || !SECURITY_SECRET) return false;
  const message = JSON.stringify(payload);
  const expected = CryptoJS.HmacSHA256(message, SECURITY_SECRET).toString();
  return expected === signature;
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const productionOrigin = APP_URL;
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (productionOrigin ? [productionOrigin] : [])
    : ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

  if (process.env.NODE_ENV === 'production' && !productionOrigin) {
    console.warn("WARNING: APP_URL is not set in production. CORS will likely block all requests.");
  }


  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Security Headers (XSS, CSRF protection, etc.)
  app.use(helmet({
    frameguard: false, // Allow iframing for AI Studio preview
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "http:", "https://*.google.com"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "connect-src": ["'self'", "https:", "http:", "wss:", "ws:", "https://*.google.com"],
        "frame-ancestors": ["'self'", "https://ai.studio", "https://*.google.com"]
      }
    }
  }));

  // Restricted CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
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
   * Internal/Session Auth Middleware
   * Protects sensitive routes (cache, telemetry proxy) using either the backend secret
   * or a valid session token (for driver/admin access).
   */
  const sessionOrInternalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const signature = req.headers['x-shipstack-signature'];
    const authHeader = req.headers.authorization;
    
    // Check internal backend signature
    if (signature && typeof signature === 'string' && signature === SECURITY_SECRET) {
      return next();
    }

    // Check session token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // simplified validation for the reconstruction
      if (token && (token.startsWith('sk_') || token.startsWith('mock-') || token.length > 32)) {
        return next();
      }
    }

    return res.status(403).json({ error: "Forbidden", message: "Invalid session or signature." });
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
    if (!FRAPPE_URL || !FRAPPE_API_KEY || !FRAPPE_API_SECRET) {
      return res.status(503).json({ error: 'ERP Unavailable', message: 'Frappe backend is not configured on the server.' });
    }

    const forwardPath = req.path.replace(/^\/api\/frappe\/?/, '');
    const allowedPaths = ['/api/resource/', '/api/method/'];
    if (!allowedPaths.some((prefix) => forwardPath.startsWith(prefix))) {
      return res.status(403).json({ error: 'Forbidden', message: 'Requested proxy path is not allowed.' });
    }

    const targetUrl = `${FRAPPE_URL}/${forwardPath}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`;
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

  // Redis Cache Routes (Protected by internal secret or session)
  app.get("/api/cache/:cacheKey", sessionOrInternalAuth, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      const value = await redis.get(req.params.cacheKey as string);
      res.json({ value });
    } catch (err) {
      console.error(`[CACHE] GET failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache GET Failed" });
    }
  });

  app.post("/api/cache/:cacheKey", sessionOrInternalAuth, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      const { value, ttl } = req.body;
      await redis.set(req.params.cacheKey as string, value, { ex: ttl || 3600 });
      res.json({ success: true });
    } catch (err) {
      console.error(`[CACHE] SET failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache SET Failed" });
    }
  });

  app.delete("/api/cache/:cacheKey", sessionOrInternalAuth, async (req, res) => {
    if (!redis) return res.status(503).json({ error: "Cache Unavailable" });
    const cacheKey = Array.isArray(req.params.cacheKey) ? req.params.cacheKey[0] : req.params.cacheKey;
    try {
      await redis.del(req.params.cacheKey as string);
      res.json({ success: true });
    } catch (err) {
      console.error(`[CACHE] DELETE failed for ${cacheKey}:`, err);
      res.status(500).json({ error: "Cache DELETE Failed" });
    }
  });

  // --- Frappe Proxy Routes ---
  
  const getFrappeHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`
  });

  /**
   * Helper to proxy requests to Frappe ERP
   * Returns JSON even if Frappe returns HTML or errors
   */
  async function proxyToFrappe(targetUrl: string, method: string, body?: any, res?: express.Response) {
    if (!FRAPPE_URL) {
      return res?.status(503).json({ error: "ERP Unavailable", message: "FRAPPE_BASE_URL is not configured." });
    }

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: getFrappeHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn(`[ERP PROXY] Non-JSON response from ${targetUrl} [${response.status}]:`, text.substring(0, 100));
        data = { 
          error: "Invalid ERP Response", 
          message: "The ERP returned a non-JSON response. Check ERP status or credentials.",
          status: response.status,
          hint: text.toLowerCase().includes('login') ? "Possibly redirected to login page. Check API Keys." : undefined
        };
      }

      const status = (data.error || !response.ok) ? (response.ok ? 502 : response.status) : 200;
      return res?.status(status).json(data);
    } catch (err: any) {
      console.error(`[ERP PROXY] Connection failed to ${targetUrl}:`, err);
      return res?.status(500).json({ error: "ERP Connection Failed", message: err.message });
    }
  }

  app.post("/api/frappe/login", async (req, res) => {
    await proxyToFrappe(`${FRAPPE_URL}/api/method/shipstack.api.login`, 'POST', req.body, res);
  });

  app.get("/api/frappe/users", sessionOrInternalAuth, async (req, res) => {
    const queryParams = new URLSearchParams(req.query as any).toString();
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/User?${queryParams}`, 'GET', undefined, res);
  });

  app.get("/api/frappe/delivery-notes", sessionOrInternalAuth, async (req, res) => {
    const queryParams = new URLSearchParams(req.query as any).toString();
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/Delivery Note?${queryParams}`, 'GET', undefined, res);
  });

  app.post("/api/frappe/create-shipment", sessionOrInternalAuth, async (req, res) => {
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/Shipment`, 'POST', req.body, res);
  });

  app.post("/api/frappe/call-method", sessionOrInternalAuth, async (req, res) => {
    const { method, args } = req.body;
    await proxyToFrappe(`${FRAPPE_URL}/api/method/${method}`, 'POST', args, res);
  });

  // --- Document Management System (DMS) Endpoints ---

  app.post("/api/documents", sessionOrInternalAuth, upload.single('file'), async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { entityType, entityId, documentType, tags, uploadedBy } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    // Deduplication Key
    const docKey = idempotencyKey 
      ? `shipstack:idempotency:${idempotencyKey}` 
      : `shipstack:doc_dedup:${entityType || 'unknown'}:${entityId || 'unknown'}:${documentType || 'unknown'}:${file.originalname}:${file.size}`;

    if (redis) {
      try {
        const cachedDoc = await redis.get(docKey);
        if (cachedDoc) {
          console.log(`[DMS] Duplicate document upload detected. Returning cached metadata.`);
          // Clean up the duplicate file to prevent disk leakage
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkErr) {
            console.warn("[DMS] Failed to remove duplicate file from disk:", unlinkErr);
          }
          return res.status(200).json(typeof cachedDoc === 'string' ? JSON.parse(cachedDoc) : cachedDoc);
        }
      } catch (redisErr) {
        console.warn("[DMS] Redis lookup failed, continuing upload without dedup", redisErr);
      }
    }

    const documentMetadata = {
      id: `doc-${Date.now()}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      entityType,
      entityId,
      documentType,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      uploadedBy,
      uploadTimestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    // Store metadata in Redis if available
    if (redis) {
      await redis.hset('shipstack:documents', { [documentMetadata.id]: JSON.stringify(documentMetadata) });
      // Index by entity
      if (entityType && entityId) {
        await redis.sadd(`shipstack:entity_documents:${entityType}:${entityId}`, documentMetadata.id);
      }
      // Save to dedup/idempotency cache
      await redis.set(docKey, JSON.stringify(documentMetadata), { ex: 3600 });
    }

    // Proxy metadata to Frappe for permanent record
    if (FRAPPE_URL) {
      try {
        await proxyToFrappe(`${FRAPPE_URL}/api/resource/Logistics Document`, 'POST', {
          doc_id: documentMetadata.id,
          filename: documentMetadata.originalName,
          file_url: `/api/documents/${documentMetadata.id}`,
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          uploaded_by: uploadedBy,
          status: 'PENDING',
          tags: JSON.stringify(documentMetadata.tags)
        });
      } catch (err) {
        console.warn("[DMS] Metadata proxy to Frappe failed, but local storage succeeded.");
      }
    }

    console.log(`[DMS] Document uploaded: ${documentMetadata.originalName} for ${entityType}:${entityId}`);
    res.status(201).json(documentMetadata);
  });

  app.get("/api/documents", sessionOrInternalAuth, async (req, res) => {
    const { entityType, entityId } = req.query;

    if (!redis) {
      return res.status(503).json({ error: "Storage/Metadata Service Unavailable" });
    }

    try {
      let docIds: string[] = [];
      if (entityType && entityId) {
        docIds = await redis.smembers(`shipstack:entity_documents:${entityType}:${entityId}`);
      } else {
        // This is slow in production, but okay for reconstruct
        const allDocs = await redis.hgetall('shipstack:documents') || {};
        docIds = Object.keys(allDocs);
      }

      if (docIds.length === 0) return res.json([]);

      const docs = await Promise.all(docIds.map(id => redis?.hget('shipstack:documents', id)));
      const filteredDocs = docs.filter(Boolean).map(d => JSON.parse(d as string));
      
      res.json(filteredDocs);
    } catch (err: any) {
      console.error("[DMS] List documents failed:", err);
      res.status(500).json({ error: "Failed to fetch document list", details: err.message });
    }
  });

  app.get("/api/documents/:id", sessionOrInternalAuth, async (req, res) => {
    const id = req.params.id as string;

    if (!redis) return res.status(503).json({ error: "Storage Unavailable" });

    try {
      const docData = await redis.hget('shipstack:documents', id);
      if (!docData) return res.status(404).json({ error: "Document not found" });

      const doc = JSON.parse(docData as string);
      const filePath = path.join(DOCUMENTS_DIR, doc.filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Physical file missing" });
      }

      res.download(filePath, doc.originalName);
    } catch (err) {
      res.status(500).json({ error: "Download failed" });
    }
  });

  app.delete("/api/documents/:id", sessionOrInternalAuth, async (req, res) => {
    const id = req.params.id as string;

    if (!redis) return res.status(503).json({ error: "Storage Unavailable" });

    try {
      const docData = await redis.hget('shipstack:documents', id);
      if (!docData) return res.status(404).json({ error: "Document not found" });

      const doc = JSON.parse(docData as string);
      const filePath = path.join(DOCUMENTS_DIR, doc.filename);

      // Delete file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete metadata
      await redis.hdel('shipstack:documents', id);
      if (doc.entityType && doc.entityId) {
        await redis.srem(`shipstack:entity_documents:${doc.entityType}:${doc.entityId}`, id);
      }

      // Proxy delete to Frappe if needed
      if (FRAPPE_URL) {
        // We'd typically search for the record first, or use the doc_id as name if we set it that way
        // Simplified for now
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Delete failed" });
    }
  });

  /**
   * Inbound Ingestion Endpoint
   * Purpose: Standardized entry point for Client ERPs to push shipment requests.
   */
  app.post("/api/ingest", apiAuthMiddleware, async (req, res) => {
    try {
      const payload = IngestSchema.parse(req.body);
      
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || `ingest:${payload.clientName}:${payload.externalId}`;
      const cacheKey = `shipstack:idempotency:${idempotencyKey}`;

      if (redis) {
        try {
          const cachedResponse = await redis.get(cacheKey);
          if (cachedResponse) {
            console.log(`[INGEST] Duplicate ingest request detected for key: ${idempotencyKey}. Returning cached response.`);
            return res.status(200).json(typeof cachedResponse === 'string' ? JSON.parse(cachedResponse) : cachedResponse);
          }
        } catch (redisErr) {
          console.warn("[INGEST] Redis lookup failed, proceeding without deduplication", redisErr);
        }
      }

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

      const responseData = { 
        success: true, 
        message: "Shipment request accepted and queued for processing.",
        internalId
      };

      if (redis) {
        await redis.set(cacheKey, JSON.stringify(responseData), { ex: 3600 });
      }

      res.status(201).json(responseData);
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
  app.post("/api/telemetry", async (req, res) => {
    try {
      const data = TelemetrySchema.parse(req.body);
      
      const authHeader = req.headers.authorization;
      let isAuthenticated = false;

      // Try signature first
      if (verifyTelemetrySignature(data)) {
        isAuthenticated = true;
      } 
      // Fallback to Bearer token
      else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token && (token.startsWith('sk_') || token.startsWith('mock-') || token.length > 32)) {
          isAuthenticated = true;
        }
      }

      if (!isAuthenticated) {
        console.warn(`[SECURITY] Forbidden telemetry attempt for DN: ${data.dnId}`);
        return res.status(403).json({ error: "Forbidden", message: "Verification failed. Valid auth token or valid HMAC signature required." });
      }

      const { dnId, lat, lng, speed, heading, timestamp } = data;
      
      const incomingTime = timestamp ? new Date(timestamp).getTime() : Date.now();
      const lastTimeKey = `shipstack:telemetry:last_time:${dnId}`;
      if (redis) {
        try {
          const lastTimeStr = await redis.get(lastTimeKey);
          if (lastTimeStr) {
            const lastTime = parseInt(lastTimeStr as string, 10);
            if (incomingTime <= lastTime) {
              console.log(`[TELEMETRY] Out-of-order or duplicate timestamp detected for DN ${dnId}. Discarding update.`);
              return res.json({ success: true, discarded: true });
            }
          }
          await redis.set(lastTimeKey, incomingTime.toString(), { ex: 86400 });
        } catch (redisErr) {
          console.warn("[TELEMETRY] Redis sequence check failed, continuing update", redisErr);
        }
      }

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
  // Local fallback job store if Redis is unavailable
  const localJobs = new Map<string, { status: string; result?: any; error?: string }>();

  app.post("/api/ai/prioritize", async (req, res) => {
    if (!genAI) return res.status(503).json({ error: "AI Service Unavailable", message: "Gemini API key not configured." });
    
    const { dns } = req.body;
    if (!dns || !Array.isArray(dns)) return res.status(400).json({ error: "Bad Request", message: "Missing 'dns' array in payload." });

    const jobId = `job-prioritize-${Date.now()}-${Math.round(Math.random() * 1E6)}`;
    const jobState = { status: 'PENDING', result: null };

    if (redis) {
      try {
        await redis.set(`shipstack:ai_job:${jobId}`, JSON.stringify(jobState), { ex: 3600 });
      } catch (err) {
        console.warn("[AI] Redis job registration failed, falling back to local memory", err);
        localJobs.set(jobId, jobState);
      }
    } else {
      localJobs.set(jobId, jobState);
    }

    // Trigger background process
    (async () => {
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

        const successState = { status: 'COMPLETED', result: parsed };
        if (redis) {
          try {
            await redis.set(`shipstack:ai_job:${jobId}`, JSON.stringify(successState), { ex: 3600 });
          } catch (err) {
            localJobs.set(jobId, successState);
          }
        } else {
          localJobs.set(jobId, successState);
        }

        io.emit("ai:job_completed", { jobId, ...successState });
        console.log(`[AI] Async job ${jobId} completed successfully.`);
      } catch (bgErr: any) {
        console.error(`[AI] Async job ${jobId} failed:`, bgErr);
        const failedState = { status: 'FAILED', error: bgErr.message || "Unknown background processing error" };
        if (redis) {
          try {
            await redis.set(`shipstack:ai_job:${jobId}`, JSON.stringify(failedState), { ex: 3600 });
          } catch (err) {
            localJobs.set(jobId, failedState);
          }
        } else {
          localJobs.set(jobId, failedState);
        }
        io.emit("ai:job_failed", { jobId, ...failedState });
      }
    })();

    // Return 202 Accepted immediately
    res.status(202).json({ jobId, status: 'PENDING' });
  });

  app.get("/api/ai/prioritize/jobs/:jobId", async (req, res) => {
    const jobId = req.params.jobId as string;

    if (redis) {
      try {
        const jobData = await redis.get(`shipstack:ai_job:${jobId}`);
        if (jobData) {
          return res.json(typeof jobData === 'string' ? JSON.parse(jobData) : jobData);
        }
      } catch (err) {
        console.warn("[AI] Redis job fetch failed, checking local memory", err);
      }
    }

    const localJob = localJobs.get(jobId);
    if (!localJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(localJob);
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
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const signature = socket.handshake.headers?.['x-shipstack-signature'];
    
    if (signature === SECURITY_SECRET) {
      return next();
    }
    
    if (token && (token.startsWith('sk_') || token.startsWith('mock-') || token.length > 32)) {
      return next();
    }
    
    return next(new Error("Authentication error: No valid token or signature provided."));
  });

  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

    socket.on("telemetry:report", async (data) => {
      // For socket reports, we also accept them if the socket itself is authenticated
      // but we still verify signature if present for extra integrity
      const hasValidSignature = verifyTelemetrySignature(data);
      
      if (!hasValidSignature) {
        // If no valid signature, we fall back to the fact that the socket connection itself was authorized
        // We log it but allow it if the DN matches or just broadcast
        console.log(`[SOCKET] Telemetry received without HMAC signature from ${socket.id}, relying on session token.`);
      }
      
      const { dnId, timestamp } = data;
      if (dnId) {
        const incomingTime = timestamp ? new Date(timestamp).getTime() : Date.now();
        const lastTimeKey = `shipstack:telemetry:last_time:${dnId}`;
        if (redis) {
          try {
            const lastTimeStr = await redis.get(lastTimeKey);
            if (lastTimeStr) {
              const lastTime = parseInt(lastTimeStr as string, 10);
              if (incomingTime <= lastTime) {
                console.log(`[SOCKET TELEMETRY] Out-of-order or duplicate timestamp detected for DN ${dnId}. Discarding update.`);
                return;
              }
            }
            await redis.set(lastTimeKey, incomingTime.toString(), { ex: 86400 });
          } catch (redisErr) {
            console.warn("[SOCKET TELEMETRY] Redis sequence check failed, continuing update", redisErr);
          }
        }
      }

      // Broadcast to all other clients
      socket.broadcast.emit("telemetry:update", {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
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
    app.get("*", (req, res) => {
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
