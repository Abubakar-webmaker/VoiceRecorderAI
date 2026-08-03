import { Request, Response } from 'express';
import * as PaymentService from '@services/payment.service';
import { ApiResponse } from '@utils/ApiResponse';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiError } from '@utils/ApiError';

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body;
  if (!plan) throw ApiError.badRequest('Plan is required');

  const session = await PaymentService.createCheckoutSession(req.userId!, plan);

  res.status(200).json(ApiResponse.success(res, { url: session.url, sessionId: session.id }, 'Checkout session created'));
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) throw ApiError.badRequest('Missing stripe-signature');

  // Note: webhook needs raw body
  await PaymentService.handleStripeWebhook(sig, req.body);

  res.status(200).json({ received: true });
});
