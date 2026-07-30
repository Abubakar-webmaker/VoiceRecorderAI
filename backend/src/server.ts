import 'dotenv/config';
import http                       from 'http';
import { Server as SocketIOServer } from 'socket.io';

import app                        from './app';
import { connectDatabase }        from './config/database';
import { verifyCloudinaryConnection } from './config/cloudinary';
import { verifyOpenAIConnection } from './config/openai';
import { initializeSockets }      from './sockets';
import { env }                    from './config/env';
import { logger }                 from './utils/logger';

const httpServer = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin:      env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  transports:         ['websocket', 'polling'],
  pingTimeout:        60_000,
  pingInterval:       25_000,
  maxHttpBufferSize:  1e7, // 10MB
});

// Sockets initialize karo
initializeSockets(io);

// ─── Graceful Shutdown ────────────────────────────────────────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.warn(`\n[Server] ${signal} received. Shutting down...`);
  httpServer.close(async () => {
    const { disconnectDatabase } = await import('./config/database');
    await disconnectDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => void gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));
process.on('uncaughtException',  (err)    => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDatabase();
  await verifyCloudinaryConnection();
  await verifyOpenAIConnection();

  httpServer.listen(env.PORT, () => {
    logger.info(`
╔══════════════════════════════════════════════╗
║       🎙️  AI Voice Recorder Backend          ║
╠══════════════════════════════════════════════╣
║  URL:         http://localhost:${env.PORT}          ║
║  Health:      http://localhost:${env.PORT}/health   ║
║  Environment: ${env.NODE_ENV.padEnd(20)}       ║
║  MongoDB:     ✅ Connected                   ║
║  Cloudinary:  ✅ Connected                   ║
║  OpenAI:      ✅ Connected                   ║
║  Socket.IO:   ✅ Ready                       ║
╚══════════════════════════════════════════════╝
    `);
  });
};

void startServer();

export { io };