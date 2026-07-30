import type { Server }     from 'socket.io';
import {
  socketAuthMiddleware,
  registerTranscriptionEvents,
} from './transcription.socket';
import { logger } from '@utils/logger';

export const initializeSockets = (io: Server): void => {
  // Global auth middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;
    logger.info(`[Socket] User connected: ${userId} (${socket.id})`);

    // User ki personal room
    void socket.join(`user:${userId}`);

    // Events register karo
    registerTranscriptionEvents(io, socket);

    socket.on('error', (err) => {
      logger.error(`[Socket] Error from ${socket.id}:`, err);
    });
  });

  logger.info('✅ Socket.IO handlers initialized');
};