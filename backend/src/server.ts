import http          from 'http';
import { Server }    from 'socket.io';
import app           from './app';
import { env }       from './config/env';
import { connectDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { initializeSockets } from './sockets';
import { logger }    from './utils/logger';

// ─── HTTP Server ──────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin:      env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports:        ['websocket', 'polling'],
  pingTimeout:       60_000,
  pingInterval:      25_000,
  maxHttpBufferSize: 1e7, // 10MB — for audio chunk streaming
});

// Attach io to app for use in controllers
app.set('io', io);

// ─── Bootstrap ────────────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Initialize Firebase
  initializeFirebase();

  // 3. Initialize Socket.IO handlers
  initializeSockets(io);

  // 3. Start HTTP server
  httpServer.listen(env.PORT, () => {
    logger.info(`
╔══════════════════════════════════════════════╗
║       🎙️  AI Voice Recorder API              ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(env.PORT).padEnd(28)}║
║  API Version : ${env.API_VERSION.padEnd(28)}║
║  URL         : http://localhost:${String(env.PORT).padEnd(15)}║
╚══════════════════════════════════════════════╝
    `);
  });
};

// ─── Process Error Handlers ───────────────────────────────────────
// Catches synchronous errors thrown outside async context
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', {
    message: error.message,
    stack:   error.stack,
  });
  process.exit(1);
});

// Catches unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error('UNHANDLED REJECTION — shutting down', { reason: message });
  httpServer.close(() => process.exit(1));
});

// ─── Start ────────────────────────────────────────────────────────
void bootstrap();

export { io };
