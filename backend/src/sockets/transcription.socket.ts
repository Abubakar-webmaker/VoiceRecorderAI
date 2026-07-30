import type { Server, Socket } from 'socket.io';
import { processAllAI, transcribeRecording } from '@services/ai.service';
import { RecordingModel }                    from '@models/Recording.model';
import { verifyAccessToken }                  from '@config/jwt';
import { logger }                             from '@utils/logger';

// ─── Auth Socket Middleware ────────────────────────────────────────
export const socketAuthMiddleware = (
  socket: Socket,
  next:   (err?: Error) => void,
): void => {
  const token =
    (socket.handshake.auth['token'] as string | undefined) ??
    (socket.handshake.headers['authorization']?.split(' ')[1]);

  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    // User info socket mein attach karo
    (socket.data as { userId: string; email: string }).userId = payload.userId;
    (socket.data as { userId: string; email: string }).email  = payload.email;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

// ─── Register Transcription Events ────────────────────────────────
export const registerTranscriptionEvents = (
  io:     Server,
  socket: Socket,
): void => {
  const userId = (socket.data as { userId: string }).userId;

  // ─── Start Transcription ────────────────────────────────────
  socket.on(
    'transcription:start',
    async (payload: {
      recordingId:     string;
      language?:       string;
      runFullPipeline: boolean;  // true = transcribe + summarize + keywords
    }) => {
      const { recordingId, language, runFullPipeline } = payload;

      if (!recordingId) {
        socket.emit('transcription:error', {
          recordingId,
          message: 'Recording ID is required',
        });
        return;
      }

      // User ki room mein join karo — multiple devices support
      await socket.join(`user:${userId}`);
      await socket.join(`recording:${recordingId}`);

      logger.info(`[Socket] Transcription requested: ${recordingId} by ${userId}`);

      // Progress callback
      const onProgress = (event: string, data: unknown): void => {
        // Sirf is recording ki room mein emit karo
        io.to(`recording:${recordingId}`).emit(event, data);
        logger.info(`[Socket] ${event}:`, JSON.stringify(data));
      };

      try {
        if (runFullPipeline) {
          await processAllAI(
            userId,
            {
              recordingId,
              language,
              summaryLength:       'medium',
              generateTitle:       true,
              generateKeywords:    true,
              generateActionItems: false,
            },
            onProgress,
          );
        } else {
          await transcribeRecording(userId, { recordingId, language }, onProgress);
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Processing failed';
        io.to(`recording:${recordingId}`).emit('transcription:error', {
          recordingId,
          message,
        });
        logger.error(`[Socket] Processing error for ${recordingId}:`, error);
      } finally {
        await socket.leave(`recording:${recordingId}`);
      }
    },
  );

  // ─── Cancel Transcription (informational only) ───────────────
  socket.on('transcription:cancel', (payload: { recordingId: string }) => {
    const { recordingId } = payload;
    socket.leave(`recording:${recordingId}`);
    socket.emit('transcription:cancelled', { recordingId });
    logger.info(`[Socket] Transcription cancelled: ${recordingId}`);
  });

  // ─── Subscribe to Recording Updates ─────────────────────────
  socket.on('recording:subscribe', async (payload: { recordingId: string }) => {
    const { recordingId } = payload;

    // Ownership verify karo
    const recording = await RecordingModel.findOne({
      _id: recordingId,
      userId,
    }).select('_id');

    if (!recording) {
      socket.emit('error', { message: 'Recording not found or access denied' });
      return;
    }

    await socket.join(`recording:${recordingId}`);
    socket.emit('recording:subscribed', { recordingId });
  });

  socket.on('recording:unsubscribe', async (payload: { recordingId: string }) => {
    await socket.leave(`recording:${payload.recordingId}`);
    socket.emit('recording:unsubscribed', { recordingId: payload.recordingId });
  });

  // ─── Disconnect ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    logger.info(`[Socket] User disconnected: ${userId} (${socket.id})`);
  });
};