import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    costINR: { type: Number, required: true, default: 0 },
    costUSD: { type: Number, required: true, default: 0 },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'quarterly', 'weekly'],
      default: 'monthly'
    },
    badge: { type: String, default: '' },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const subscriptionCatalogSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true,
      default: 'Entertainment'
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
    website: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    plans: [planSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    dataSource: {
      type: String,
      enum: ['verified_official_catalog', 'manual_admin', 'partner_feed'],
      default: 'verified_official_catalog'
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'needs_review', 'discontinued'],
      default: 'verified'
    },
    lastVerifiedAt: {
      type: Date,
      default: () => new Date()
    },
    metadata: {
      currencySupport: {
        type: [String],
        default: ['INR', 'USD']
      },
      disclaimer: {
        type: String,
        default: 'Pricing reflects publicly verified standard subscription plans. Custom and student plans may vary.'
      }
    }
  },
  {
    timestamps: true
  }
);

// Search index on name, description, category
subscriptionCatalogSchema.index({ name: 'text', description: 'text', category: 'text' });

const SubscriptionCatalog = mongoose.model('SubscriptionCatalog', subscriptionCatalogSchema);

export default SubscriptionCatalog;
