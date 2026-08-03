import { stripe } from '@config/stripe';
import { env } from '@config/env';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@models/Subscription.model';
import { User } from '@models/User.model';
import { ApiError } from '@utils/ApiError';
import { logger } from '@utils/logger';

// ─── Create Checkout Session ──────────────────────────────────────
export const createCheckoutSession = async (userId: string, plan: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const priceId = plan === 'pro' ? env.STRIPE_PRO_PLAN_ID : null;
  if (!priceId) throw ApiError.badRequest('Invalid plan selected');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: userId,
    success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/payment/cancel`,
    metadata: { userId, plan },
  });

  return session;
};

// ─── Handle Webhook Events ────────────────────────────────────────
export const handleStripeWebhook = async (signature: string, rawBody: Buffer) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err}`);
    throw ApiError.badRequest('Invalid webhook signature');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      await handleSubscriptionCreated(session);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      await handlePaymentSucceeded(invoice);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      await handleSubscriptionDeleted(subscription);
      break;
    }
  }

  return { received: true };
};

// ─── Event Handlers ───────────────────────────────────────────────

async function handleSubscriptionCreated(session: any) {
  const userId = session.client_reference_id;
  const stripeSubscriptionId = session.subscription;
  const stripeCustomerId = session.customer;

  await Subscription.findOneAndUpdate(
    { userId },
    {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      stripeSubscriptionId,
      stripeCustomerId,
      startDate: new Date(),
    },
    { upsert: true }
  );

  logger.info(`Subscription created for user: ${userId}`);
}

async function handlePaymentSucceeded(invoice: any) {
  const stripeSubscriptionId = invoice.subscription;
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { status: SubscriptionStatus.ACTIVE }
  );
}

async function handleSubscriptionDeleted(subscription: any) {
  const stripeSubscriptionId = subscription.id;
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { status: SubscriptionStatus.EXPIRED, plan: SubscriptionPlan.FREE }
  );
}
