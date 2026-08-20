import express, { Router } from 'express';
import * as PaymentController from '@controllers/payment.controller';
import { protect } from '@middleware/auth.middleware';

const router = Router();

// Webhook must use express.raw for signature verification
router.post('/webhook', PaymentController.webhook);

// Protected routes
router.use(protect);
router.post('/create-session', PaymentController.createSession);

export { router as paymentRouter };
