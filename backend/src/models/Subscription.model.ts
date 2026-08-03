import mongoose, { Schema, type Document } from 'mongoose';

export enum SubscriptionPlan {
  FREE = 'free',
  PRO  = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE   = 'active',
  CANCELED = 'canceled',
  EXPIRED  = 'expired',
  TRIALING = 'trialing',
}

export interface ISubscription extends Document {
  userId:         mongoose.Types.ObjectId;
  plan:           SubscriptionPlan;
  status:         SubscriptionStatus;
  startDate:      Date;
  endDate:        Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  stripeCustomerId:     string | null;
  createdAt:      Date;
  updatedAt:      Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    plan: {
      type:    String,
      enum:    Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE,
    },
    status: {
      type:    String,
      enum:    Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    startDate: { type: Date, default: Date.now },
    endDate:   { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    stripeSubscriptionId: { type: String, default: null },
    stripeCustomerId:     { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
