import express, { type Application, type Request, type Response } from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import morgan        from 'morgan';
import compression   from 'compression';
import rateLimit     from 'express-rate-limit';
import cookieParser  from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss           from 'xss-clean';
import hpp           from 'hpp';

import { env }                                 from './config/env';
import { apiRouter }                           from './routes';
import { errorHandler, notFoundHandler }       from './middleware/error.middleware';
import { logger }                              from './utils/logger';

const app: Application = express();

// ─── Trust Proxy (production load balancer ke liye) ───────────────
app.set('trust proxy', 1);

// ─── Security Headers ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy:  { policy: 'cross-origin' },
    contentSecurityPolicy:      false, // Mobile API ke liye
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
      // Mobile app ka origin null hota hai — allow karo
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials:     true,
    methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:  ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders:  ['X-Total-Count'],
  }),
);

// ─── Rate Limiting ────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
  max:      Number(env.RATE_LIMIT_MAX_REQUESTS),
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (_req, res) => {
    res.status(429).json({
      success:   false,
      message:   'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  },
});

// Auth routes pe strict limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      20,              // 20 auth requests per 15 min
  message: {
    success:   false,
    message:   'Too many authentication attempts. Please try again after 15 minutes.',
    timestamp: new Date().toISOString(),
  },
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth/login',           authLimiter);
app.use('/api/v1/auth/register',        authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Security: Input Sanitization ────────────────────────────────
app.use(mongoSanitize());  // NoSQL injection prevention
app.use(xss());            // XSS prevention
app.use(hpp());            // HTTP parameter pollution prevention

// ─── HTTP Logging ─────────────────────────────────────────────────
app.use(
  morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success:     true,
    message:     '🎙️ AI Voice Recorder API is healthy',
    environment: env.NODE_ENV,
    version:     env.API_VERSION,
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

// ─── API Routes ───────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, apiRouter);

// ─── 404 + Error Handlers (order matters!) ───────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;