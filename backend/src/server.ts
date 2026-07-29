import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

import app from './app';

// ─── Server Setup ─────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;
const httpServer = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.warn(`[Socket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.warn(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Database Connection ──────────────────────────────────────────
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in .env');

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.warn('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────
const gracefulShutdown = async (): Promise<void> => {
  console.warn('\n[Server] Shutting down gracefully...');
  httpServer.close(async () => {
    await mongoose.connection.close();
    console.warn('[Server] MongoDB connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ─── Start Server ─────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.warn(`
🚀 AI Voice Recorder Server Running!
   URL:         http://localhost:${PORT}
   Health:      http://localhost:${PORT}/health
   Environment: ${process.env.NODE_ENV ?? 'development'}
   MongoDB:     Connected
   Socket.IO:   Ready
    `);
  });
};

void startServer();

export { io };