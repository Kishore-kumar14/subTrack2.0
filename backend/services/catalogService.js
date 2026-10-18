import SubscriptionCatalog from '../models/SubscriptionCatalog.js';
import { PROVIDER_CATALOG } from '../../frontend/src/data/providerCatalog.js';

export const catalogService = {
  /**
   * Safe and idempotent seeding of the subscription catalog in MongoDB Atlas.
   * Can be executed repeatedly without generating duplicate records.
   */
  async seedCatalog(customProviders = null) {
    const sourceData = customProviders || PROVIDER_CATALOG;
    if (!Array.isArray(sourceData) || sourceData.length === 0) {
      return { success: false, message: 'No provider data available to seed', count: 0 };
    }

    const operations = sourceData.map((p) => {
      const providerId = (p.providerId || p.id).toLowerCase().trim();
      const catalogRecord = {
        providerId,
        name: p.name,
        category: p.category || 'Entertainment',
        brandColor: p.brandColor || '#2563EB',
        iconText: p.iconText || '★',
        logo: p.logo || null,
        website: p.website || '',
        description: p.description || '',
        plans: (p.plans || []).map((plan) => ({
          id: plan.id,
          name: plan.name,
          costINR: Number(plan.costINR) || 0,
          costUSD: Number(plan.costUSD) || 0,
          billingCycle: plan.billingCycle || 'monthly',
          badge: plan.badge || '',
          features: plan.features || [],
          isActive: plan.isActive !== false
        })),
        isActive: p.isActive !== false,
        dataSource: p.dataSource || 'verified_official_catalog',
        verificationStatus: p.verificationStatus || 'verified',
        lastVerifiedAt: p.lastVerifiedAt ? new Date(p.lastVerifiedAt) : new Date(),
        metadata: {
          currencySupport: ['INR', 'USD'],
          disclaimer: 'Pricing reflects publicly verified standard subscription plans. Custom and student plans may vary.'
        }
      };

      return {
        updateOne: {
          filter: { providerId },
          update: { $set: catalogRecord },
          upsert: true
        }
      };
    });

    const result = await SubscriptionCatalog.bulkWrite(operations);
    return {
      success: true,
      count: operations.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    };
  },

  /**
   * Retrieve catalog records with search and category filtering.
   */
  async getCatalog({ search = '', category = 'All', activeOnly = true } = {}) {
    const filter = {};

    if (activeOnly) {
      filter.isActive = true;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const queryRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: queryRegex },
        { category: queryRegex },
        { description: queryRegex },
        { 'plans.name': queryRegex }
      ];
    }

    return await SubscriptionCatalog.find(filter).sort({ name: 1 });
  },

  /**
   * Retrieve a single catalog provider by its providerId
   */
  async getCatalogProvider(providerId) {
    if (!providerId) return null;
    return await SubscriptionCatalog.findOne({ providerId: providerId.toLowerCase().trim() });
  },

  /**
   * Administrative update of a catalog entry.
   * Updates only catalog metadata; user-specific subscriptions remain untouched.
   */
  async updateCatalogProvider(providerId, updateData) {
    if (!providerId) throw new Error('providerId is required');

    const cleanId = providerId.toLowerCase().trim();
    const payload = {
      ...updateData,
      providerId: cleanId,
      lastVerifiedAt: new Date()
    };

    const updated = await SubscriptionCatalog.findOneAndUpdate(
      { providerId: cleanId },
      { $set: payload },
      { new: true, upsert: false }
    );

    if (!updated) {
      throw new Error(`Catalog provider '${providerId}' not found`);
    }

    return updated;
  },

  /**
   * Refresh catalog freshness status.
   * Evaluates freshness without fabricating unauthenticated live sync.
   * Providers unverified for > 90 days are flagged as 'needs_review'.
   */
  async refreshCatalogFreshness() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const staleResult = await SubscriptionCatalog.updateMany(
      { lastVerifiedAt: { $lt: cutoffDate }, verificationStatus: 'verified' },
      { $set: { verificationStatus: 'needs_review' } }
    );

    const totalCount = await SubscriptionCatalog.countDocuments();
    const verifiedCount = await SubscriptionCatalog.countDocuments({ verificationStatus: 'verified' });
    const needsReviewCount = await SubscriptionCatalog.countDocuments({ verificationStatus: 'needs_review' });

    console.log(`[Catalog Freshness Audit] Total: ${totalCount}, Verified: ${verifiedCount}, Needs Review: ${needsReviewCount}`);

    return {
      success: true,
      totalProviders: totalCount,
      verifiedCount,
      needsReviewCount,
      markedNeedsReview: staleResult.modifiedCount,
      checkedAt: new Date().toISOString()
    };
  }
};

export default catalogService;
