import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import CryptoJS from 'crypto-js';
import { Redis } from "@upstash/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Error Monitoring (opt-in via SENTRY_DSN) ---
const SENTRY_ENABLED = Boolean(process.env.SENTRY_DSN);
if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  });
  console.log('[SENTRY] Error monitoring enabled');
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
const FRAPPE_SITE = process.env.FRAPPE_SITE || '';

if (process.env.NODE_ENV === "production" && (!FRAPPE_API_KEY || !FRAPPE_API_SECRET)) {
  console.warn("WARNING: Frappe credentials missing in production. Proxy routes will be degraded.");
}


const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// --- Session Token Validation (against Frappe) ---
// Tokens issued by shipstack.api.auth.login are Frappe "api_key:api_secret"
// pairs. We validate them against Frappe and cache the verdict briefly so we
// don't add an ERP round-trip to every proxied request.
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const tokenCache = new Map<string, { valid: boolean; expiresAt: number }>();

const isValidSessionToken = async (token: string): Promise<boolean> => {
  if (!token) return false;

  // Dev-only: mock tokens keep demo flows working without an ERP.
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-')) return true;

  // No ERP configured: permissive in dev, deny in production.
  if (!FRAPPE_URL) return process.env.NODE_ENV !== 'production';

  const cached = tokenCache.get(token);
  if (cached && Date.now() < cached.expiresAt) return cached.valid;

  let valid = false;
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `token ${token}`
    };
    if (FRAPPE_SITE) {
      headers['X-Frappe-Site-Name'] = FRAPPE_SITE;
      headers['Host'] = FRAPPE_SITE;
    }
    const response = await fetch(`${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`, { headers });
    valid = response.ok;
  } catch (err) {
    console.error('[AUTH] Session token validation failed (ERP unreachable):', err);
    valid = false;
  }

  tokenCache.set(token, { valid, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
  // Bound memory: evict oldest entries past 5000 tokens
  if (tokenCache.size > 5000) {
    const oldest = tokenCache.keys().next().value;
    if (oldest !== undefined) tokenCache.delete(oldest);
  }
  return valid;
};

// --- M-Pesa (Safaricom Daraja) Configuration ---
const MPESA_ENV = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
const MPESA_BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || (APP_URL ? `${APP_URL.replace(/\/$/, '')}/api/mpesa/callback` : '');
const isMpesaConfigured = Boolean(MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET && MPESA_SHORTCODE && MPESA_PASSKEY);

if (process.env.NODE_ENV === 'production' && !isMpesaConfigured) {
  console.warn('WARNING: M-Pesa credentials missing in production. Payment requests will be rejected.');
}

// Daraja OAuth tokens are valid for ~1 hour; cache and refresh 60s early.
let mpesaToken: { value: string; expiresAt: number } | null = null;

const getMpesaToken = async (): Promise<string> => {
  if (mpesaToken && Date.now() < mpesaToken.expiresAt) {
    return mpesaToken.value;
  }
  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { 'Authorization': `Basic ${credentials}` }
  });
  if (!response.ok) {
    throw new Error(`Daraja OAuth failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json() as { access_token: string; expires_in: string };
  mpesaToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000
  };
  return mpesaToken.value;
};

/** Normalize Kenyan MSISDNs to Daraja's required 2547XXXXXXXX format. */
const normalizeMsisdn = (phone: string): string => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1')) return `254${digits}`;
  return digits;
};

const mpesaTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const MpesaStkSchema = z.object({
  phone: z.string().min(9),
  amount: z.number().positive(),
  reference: z.string().min(1).max(12),
  description: z.string().max(13).optional()
});

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

  // --- Rate Limiting ---
  // Behind nginx, the client IP arrives via X-Forwarded-For.
  app.set('trust proxy', 1);
  const makeLimiter = (windowMs: number, max: number, message: string) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too Many Requests", message }
  });

  // Auth: brute-force protection
  app.use('/api/frappe/login', makeLimiter(15 * 60 * 1000, 20, 'Too many login attempts. Try again in 15 minutes.'));
  // External ingestion: modest per-client budget
  app.use('/api/ingest', makeLimiter(60 * 1000, 30, 'Ingestion rate limit exceeded.'));
  // Telemetry: high-frequency but bounded (2 updates/sec sustained)
  app.use('/api/telemetry', makeLimiter(60 * 1000, 120, 'Telemetry rate limit exceeded.'));
  // Payments: STK pushes are expensive downstream
  app.use('/api/mpesa/stk-push', makeLimiter(60 * 1000, 10, 'Payment request rate limit exceeded.'));
  app.use('/api/etims', makeLimiter(60 * 1000, 20, 'Invoice generation rate limit exceeded.'));
  // General API safety net
  app.use('/api/', makeLimiter(60 * 1000, 300, 'API rate limit exceeded.'));

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
  const sessionOrInternalAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const signature = req.headers['x-shipstack-signature'];
    const authHeader = req.headers.authorization;

    // Check internal backend signature
    if (signature && typeof signature === 'string' && signature === SECURITY_SECRET) {
      return next();
    }

    // Check session token against Frappe (cached)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && await isValidSessionToken(token)) {
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
  
  const getFrappeHeaders = (req?: express.Request) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`
    };
    const site = FRAPPE_SITE || (req ? (req.headers['x-frappe-site'] as string) : '');
    if (site) {
      headers['X-Frappe-Site-Name'] = site;
      headers['Host'] = site;
    }
    return headers;
  };

  /**
   * Broadcast a realtime event to SPA clients via Frappe's socket.io server.
   * Used for events that originate in this proxy (external ERP ingestion,
   * payment callbacks) rather than in Frappe's document lifecycle.
   */
  const publishRealtime = async (event: string, message: any, room?: string) => {
    if (!FRAPPE_URL || !FRAPPE_API_KEY || !FRAPPE_API_SECRET) {
      console.log(`[REALTIME:LOCAL] Frappe not configured, event dropped: ${event}`, message);
      return;
    }
    try {
      const response = await fetch(`${FRAPPE_URL}/api/method/shipstack.api.realtime.publish_event`, {
        method: 'POST',
        headers: getFrappeHeaders(),
        body: JSON.stringify({ event, message: JSON.stringify(message), room })
      });
      if (!response.ok) {
        console.error(`[REALTIME] Frappe publish failed for ${event}: ${response.status}`);
      }
    } catch (err) {
      console.error(`[REALTIME] Frappe publish error for ${event}:`, err);
    }
  };

  /**
   * Helper to proxy requests to Frappe ERP
   * Returns JSON even if Frappe returns HTML or errors
   */
  async function proxyToFrappe(targetUrl: string, method: string, body?: any, res?: express.Response, req?: express.Request) {
    if (!FRAPPE_URL) {
      return res?.status(503).json({ error: "ERP Unavailable", message: "FRAPPE_BASE_URL is not configured." });
    }

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: getFrappeHeaders(req),
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
    await proxyToFrappe(`${FRAPPE_URL}/api/method/shipstack.api.login`, 'POST', req.body, res, req);
  });

  app.get("/api/frappe/users", sessionOrInternalAuth, async (req, res) => {
    const queryParams = new URLSearchParams(req.query as any).toString();
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/User?${queryParams}`, 'GET', undefined, res, req);
  });

  app.get("/api/frappe/delivery-notes", sessionOrInternalAuth, async (req, res) => {
    const queryParams = new URLSearchParams(req.query as any).toString();
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/Shipstack Delivery Note?${queryParams}`, 'GET', undefined, res, req);
  });

  app.post("/api/frappe/create-shipment", sessionOrInternalAuth, async (req, res) => {
    await proxyToFrappe(`${FRAPPE_URL}/api/resource/Shipment`, 'POST', req.body, res, req);
  });

  app.post("/api/frappe/call-method", sessionOrInternalAuth, async (req, res) => {
    const { method, args } = req.body;
    await proxyToFrappe(`${FRAPPE_URL}/api/method/${method}`, 'POST', args, res, req);
  });

  // Dynamic catch-all proxy for general Frappe API requests (mounted AFTER explicit routes)
  app.use("/api/frappe", forwardFrappeRequest);

  // --- Document Management System (DMS) Endpoints ---

  app.post("/api/documents", sessionOrInternalAuth, upload.single('file'), async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { entityType, entityId, documentType, tags, uploadedBy } = req.body;

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
    }

    // Proxy metadata to Frappe for permanent record
    if (FRAPPE_URL) {
      try {
        await proxyToFrappe(`${FRAPPE_URL}/api/resource/Shipstack Logistics Document`, 'POST', {
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
  app.post("/api/ingest", apiAuthMiddleware, (req, res) => {
    try {
      const payload = IngestSchema.parse(req.body);
      
      console.log(`[INGEST] Received shipment request: ${payload.externalId} from ${payload.clientName}`);

      // Broadcast to all connected clients (Admin Dashboard, etc.) via Frappe realtime.
      // Clients listen on room "shipstack_ingest" (see services/socket.ts onIngestNew).
      const internalId = `dn-api-${Date.now()}`;
      publishRealtime("ingest:new", {
        ...payload,
        id: internalId,
        status: "RECEIVED",
        createdAt: new Date().toISOString(),
        logs: [{ id: Date.now().toString(), action: 'Ingested via API', notes: 'Automated ERP sync', user: 'System', timestamp: new Date().toISOString() }]
      }, "shipstack_ingest");

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

  // Telemetry Endpoint
  app.post("/api/telemetry", async (req, res) => {
    try {
      const data = TelemetrySchema.parse(req.body);
      
      const authHeader = req.headers.authorization;
      let isAuthenticated = false;

      // Try HMAC signature first (hardware trackers signing with SECURITY_SECRET)
      if (verifyTelemetrySignature(data)) {
        isAuthenticated = true;
      }
      // Fallback to Bearer session token (driver app), validated against Frappe
      else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token && await isValidSessionToken(token)) {
          isAuthenticated = true;
        }
      }

      if (!isAuthenticated) {
        console.warn(`[SECURITY] Forbidden telemetry attempt for DN: ${data.dnId}`);
        return res.status(403).json({ error: "Forbidden", message: "Verification failed. Valid auth token or valid HMAC signature required." });
      }

      const { dnId, lat, lng, speed, heading, timestamp } = data;
      
      // Save Telemetry Point to Frappe (which in turn broadcasts it via socket.io)
      await proxyToFrappe(`${FRAPPE_URL}/api/resource/Shipstack Telemetry Point`, 'POST', {
        trip_id: dnId,
        lat,
        lng,
        timestamp: timestamp || new Date().toISOString(),
        speed,
        heading
      }, res, req);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation Error", 
          details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Telemetry Endpoint Error:", err);
      res.status(500).json({ error: "Internal Server Error", message: err instanceof Error ? err.message : String(err) });
    }
  });

  /**
   * M-Pesa STK Push (Daraja API)
   * Purpose: Trigger a payment request on the user's phone.
   * Falls back to a simulated response only in non-production when Daraja
   * credentials are not configured (local development).
   */
  app.post("/api/mpesa/stk-push", sessionOrInternalAuth, async (req, res) => {
    let payload: z.infer<typeof MpesaStkSchema>;
    try {
      payload = MpesaStkSchema.parse({ ...req.body, amount: Number(req.body.amount) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      throw err;
    }

    const { phone, amount, reference, description } = payload;

    if (!isMpesaConfigured) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: "Payments Unavailable", message: "M-Pesa is not configured on this server." });
      }
      console.log(`[M-PESA:SIMULATED] STK Push for ${phone}, Amount: ${amount}, Ref: ${reference}`);
      return res.json({
        MerchantRequestID: `sim-req-${Date.now()}`,
        CheckoutRequestID: `sim-chk-${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing (SIMULATED)",
        CustomerMessage: "Success. Request accepted for processing",
        simulated: true
      });
    }

    if (!MPESA_CALLBACK_URL) {
      return res.status(503).json({ error: "Payments Misconfigured", message: "MPESA_CALLBACK_URL (or APP_URL) must be set to receive payment results." });
    }

    try {
      const token = await getMpesaToken();
      const timestamp = mpesaTimestamp();
      const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
      const msisdn = normalizeMsisdn(phone);

      const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.ceil(amount),
          PartyA: msisdn,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: msisdn,
          CallBackURL: MPESA_CALLBACK_URL,
          AccountReference: reference,
          TransactionDesc: description || `Shipstack ${reference}`
        })
      });

      const data = await response.json();
      if (!response.ok || data.errorCode) {
        console.error(`[M-PESA] STK Push rejected for ref ${reference}:`, data);
        return res.status(502).json({ error: "Payment Request Failed", message: data.errorMessage || data.ResponseDescription || 'Daraja rejected the request.' });
      }

      console.log(`[M-PESA] STK Push accepted for ref ${reference}: ${data.CheckoutRequestID}`);
      res.json(data);
    } catch (err: any) {
      console.error('[M-PESA] STK Push failed:', err);
      res.status(502).json({ error: "Payment Request Failed", message: err.message });
    }
  });

  /**
   * M-Pesa Callback (Daraja posts payment results here)
   * Must always ACK with ResultCode 0, otherwise Daraja retries.
   */
  app.post("/api/mpesa/callback", async (req, res) => {
    // ACK immediately; processing failures are ours to handle, not Daraja's.
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });

    try {
      const stkCallback = req.body?.Body?.stkCallback;
      if (!stkCallback) {
        console.warn('[M-PESA] Callback with unexpected shape:', JSON.stringify(req.body).substring(0, 200));
        return;
      }

      const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } = stkCallback;
      const success = Number(ResultCode) === 0;

      const metadata: Record<string, any> = {};
      for (const item of stkCallback.CallbackMetadata?.Item || []) {
        metadata[item.Name] = item.Value;
      }

      console.log(`[M-PESA] Callback ${CheckoutRequestID}: ${success ? 'PAID' : `FAILED (${ResultCode}: ${ResultDesc})`}`);

      // Persist payment result to Frappe for reconciliation
      if (FRAPPE_URL && FRAPPE_API_KEY) {
        try {
          await fetch(`${FRAPPE_URL}/api/resource/Shipstack Payment`, {
            method: 'POST',
            headers: getFrappeHeaders(),
            body: JSON.stringify({
              checkout_request_id: CheckoutRequestID,
              merchant_request_id: MerchantRequestID,
              status: success ? 'PAID' : 'FAILED',
              result_code: ResultCode,
              result_description: ResultDesc,
              amount: metadata.Amount,
              mpesa_receipt: metadata.MpesaReceiptNumber,
              phone: metadata.PhoneNumber ? String(metadata.PhoneNumber) : undefined,
              transaction_date: metadata.TransactionDate ? String(metadata.TransactionDate) : undefined
            })
          });
        } catch (err) {
          console.error('[M-PESA] Failed to persist payment result to Frappe:', err);
        }
      }

      // Notify connected clients (Invoicing view, PaymentModal) in real time
      publishRealtime("payment:update", {
        provider: 'MPESA',
        checkoutRequestId: CheckoutRequestID,
        status: success ? 'PAID' : 'FAILED',
        resultCode: ResultCode,
        resultDescription: ResultDesc,
        amount: metadata.Amount,
        receipt: metadata.MpesaReceiptNumber,
        phone: metadata.PhoneNumber ? String(metadata.PhoneNumber) : undefined
      });
    } catch (err) {
      console.error('[M-PESA] Callback processing error:', err);
    }
  });

  /**
   * KRA eTIMS Invoice Generation
   * Purpose: Generate a tax-compliant invoice via the eTIMS OSCU/VSCU API
   * (or a certified middleware). Falls back to a simulated response only in
   * non-production when eTIMS is not configured.
   */
  const ETIMS_BASE_URL = process.env.ETIMS_BASE_URL?.replace(/\/$/, '') || '';
  const ETIMS_API_KEY = process.env.ETIMS_API_KEY || '';
  const ETIMS_DEVICE_SERIAL = process.env.ETIMS_DEVICE_SERIAL || '';
  const isEtimsConfigured = Boolean(ETIMS_BASE_URL && ETIMS_API_KEY);

  app.post("/api/etims/generate", sessionOrInternalAuth, async (req, res) => {
    const { invoiceData } = req.body;
    if (!invoiceData || !invoiceData.externalId) {
      return res.status(400).json({ error: "Validation Error", message: "invoiceData with externalId is required." });
    }

    if (!isEtimsConfigured) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: "eTIMS Unavailable", message: "eTIMS is not configured on this server." });
      }
      console.log(`[eTIMS:SIMULATED] Tax invoice for: ${invoiceData.externalId}`);
      const simInvoice = `SIM-INV-${Date.now()}`;
      return res.json({
        cuInvoiceNumber: simInvoice,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://itax.kra.go.ke/KRA-Portal/invoiceVerify.htm?inv=${simInvoice}`)}`,
        status: "SUCCESS",
        simulated: true
      });
    }

    try {
      console.log(`[eTIMS] Generating tax invoice for: ${invoiceData.externalId}`);
      const response = await fetch(`${ETIMS_BASE_URL}/trnsSales/saveSales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ETIMS_API_KEY}`,
          ...(ETIMS_DEVICE_SERIAL ? { 'X-Device-Serial': ETIMS_DEVICE_SERIAL } : {})
        },
        body: JSON.stringify(invoiceData)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.resultCd && data.resultCd !== '000') {
        console.error(`[eTIMS] Invoice rejected for ${invoiceData.externalId}:`, data);
        return res.status(502).json({ error: "eTIMS Rejected", message: data.resultMsg || `eTIMS returned ${response.status}` });
      }

      // Persist the CU invoice reference to Frappe for audit/compliance
      if (FRAPPE_URL && FRAPPE_API_KEY) {
        fetch(`${FRAPPE_URL}/api/method/shipstack.api.log_audit`, {
          method: 'POST',
          headers: getFrappeHeaders(),
          body: JSON.stringify({
            action: 'ETIMS_INVOICE_GENERATED',
            details: JSON.stringify({ externalId: invoiceData.externalId, cuInvoiceNumber: data.curRcptNo || data.cuInvoiceNumber })
          })
        }).catch(err => console.warn('[eTIMS] Audit log to Frappe failed:', err));
      }

      res.json({
        cuInvoiceNumber: data.curRcptNo || data.cuInvoiceNumber || data.invcNo,
        qrCodeUrl: data.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://itax.kra.go.ke/KRA-Portal/invoiceVerify.htm?inv=${data.curRcptNo || data.invcNo}`)}`,
        status: "SUCCESS",
        kraResponse: data
      });
    } catch (err: any) {
      console.error('[eTIMS] Generation failed:', err);
      res.status(502).json({ error: "eTIMS Connection Failed", message: err.message });
    }
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



  // Sentry error handler must run before the JSON error handler
  if (SENTRY_ENABLED) {
    Sentry.setupExpressErrorHandler(app);
  }

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
