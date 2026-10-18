import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    providerId: {
      type: String,
      default: null,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    planName: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Other'
    },
    cost: {
      type: Number,
      required: true,
      default: 0
    },
    costUSD: {
      type: Number,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'quarterly', 'weekly'],
      default: 'monthly'
    },
    firstBillingDate: {
      type: String,
      default: null
    },
    nextRenewalDate: {
      type: String,
      default: null
    },
    lastRenewedDate: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      default: 'Credit Card'
    },
    isFreeTrial: {
      type: Boolean,
      default: false
    },
    trialEndDate: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'paused', 'cancelled'],
      default: 'active'
    },
    reminderDays: {
      type: Number,
      default: 3
    },
    usageFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'rarely', 'never'],
      default: 'daily'
    },
    brandColor: {
      type: String,
      default: '#2563EB'
    },
    iconText: {
      type: String,
      default: '★'
    },
    logo: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    googleCalendarEventId: {
      type: String,
      default: null,
      index: true
    },
    googleCalendarStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed', 'not_synced'],
      default: 'not_synced'
    },
    googleCalendarSyncedAt: {
      type: Date,
      default: null
    },
    googleCalendarError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({ userId: 1, id: 1 });
subscriptionSchema.index({ userId: 1, providerId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
