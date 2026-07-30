import { Router }          from 'express';
import { authRouter }      from './auth.routes';
import { recordingRouter } from './recording.routes';
import { folderRouter }    from './folder.routes';
import { aiRouter }        from './ai.routes';

const apiRouter = Router();

apiRouter.use('/auth',       authRouter);
apiRouter.use('/recordings', recordingRouter);
apiRouter.use('/folders',    folderRouter);
apiRouter.use('/ai',         aiRouter);

// Phase 6+ mein add honge:
// apiRouter.use('/users',         userRouter);
// apiRouter.use('/subscriptions', subscriptionRouter);
// apiRouter.use('/notifications', notificationRouter);
// apiRouter.use('/settings',      settingsRouter);

export { apiRouter };