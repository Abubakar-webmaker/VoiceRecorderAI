import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@models/Subscription.model';
import { User } from '@models/User.model';
import { ApiError } from '@utils/ApiError';

// ─── Get User Subscription ────────────────────────────────────────
export const getUserSubscription = async (userId: string) => {
  let subscription = await Subscription.findOne({ userId });

  if (!subscription) {
    // Create default free subscription
    subscription = await Subscription.create({
      userId,
      plan:   SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
    });
  }

  return subscription;
};

// ─── Check Feature Access ─────────────────────────────────────────
export const checkFeatureAccess = async (
  userId:  string,
  feature: 'ai_processing' | 'storage_limit' | 'unlimited_folders',
): Promise<boolean> => {
  const sub = await getUserSubscription(userId);

  if (sub.plan === SubscriptionPlan.ENTERPRISE) return true;

  if (sub.plan === SubscriptionPlan.PRO) {
    return true; // Pro has access to all for now
  }

  // Free tier limits
  if (feature === 'ai_processing') {
    // Maybe check some usage counter in User model
    return true; // Limit by usage, not just existence
  }

  return false;
};

// ─── Update Subscription (e.g. from Stripe Webhook) ─────────────
export const updateSubscription = async (
  userId: string,
  data:   Partial<any>
) => {
  return Subscription.findOneAndUpdate({ userId }, data, { new: true, upsert: true });
};
