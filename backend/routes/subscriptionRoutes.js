import express from 'express';
import Subscription from '../models/Subscription.js';
import SubscriptionCatalog from '../models/SubscriptionCatalog.js';
import { isDBConnected } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import calendarSyncService from '../services/calendarSyncService.js';

const router = express.Router();

// Middleware to check DB connection
const checkDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      error: 'MongoDB is not connected. Please ensure MongoDB is running and MONGODB_URI is configured correctly.'
    });
  }
  next();
};

// Apply DB connection check and authentication middleware to all subscription routes
router.use(checkDB);
router.use(requireAuth);

/**
 * GET /api/subscriptions
 * Fetch subscriptions ONLY for the authenticated user identity
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/:id
 * Fetch a single subscription belonging strictly to the authenticated user
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ id: req.params.id, userId });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found for this user' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions
 * Create a new subscription strictly bound to the authenticated user identity
 */
router.post('/', async (req, res) => {
  try {
    const subData = req.body;
    const userId = req.user.id;
    subData.userId = userId;

    if (!subData.id) {
      subData.id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // Validate and link catalog provider if provided
    if (subData.providerId && subData.providerId !== 'custom') {
      try {
        const catalogProvider = await SubscriptionCatalog.findOne({
          providerId: subData.providerId.toLowerCase().trim()
        });
        if (catalogProvider) {
          // Inherit branding and categorization defaults if not explicitly set,
          // while leaving user-specific pricing, cycle, and dates completely untouched
          if (!subData.brandColor) subData.brandColor = catalogProvider.brandColor;
          if (!subData.logo) subData.logo = catalogProvider.logo;
          if (!subData.category) subData.category = catalogProvider.category;
        }
      } catch (err) {
        console.warn('Catalog validation notice:', err.message);
      }
    }

    // Check if subscription with this ID already exists for this user
    const existing = await Subscription.findOne({ id: subData.id, userId });
    if (existing) {
      const updatePayload = { ...subData };
      delete updatePayload.userId;
      delete updatePayload.id;
      delete updatePayload._id;

      const updated = await Subscription.findOneAndUpdate(
        { id: subData.id, userId },
        { $set: updatePayload },
        { new: true }
      );

      // Automatic Google Calendar update
      calendarSyncService.syncSubscription(userId, updated.id, req.body.googleAccessToken).catch((err) => {
        console.warn('Background Google Calendar sync notice:', err.message);
      });

      return res.json(updated);
    }

    const newSub = new Subscription(subData);
    const saved = await newSub.save();

    // Automatic Google Calendar creation
    calendarSyncService.syncSubscription(userId, saved.id, req.body.googleAccessToken).catch((err) => {
      console.warn('Background Google Calendar sync notice:', err.message);
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating subscription in MongoDB:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/bulk
 * Bulk insert or restore subscriptions for the authenticated user
 */
router.post('/bulk', async (req, res) => {
  try {
    const { subscriptions, googleAccessToken } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(subscriptions)) {
      return res.status(400).json({ error: 'Array of subscriptions required' });
    }

    const operations = subscriptions.map((sub) => {
      const id = sub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const cleanSub = { ...sub };
      delete cleanSub.userId;
      delete cleanSub._id;

      return {
        updateOne: {
          filter: { id, userId },
          update: { $set: { ...cleanSub, id, userId } },
          upsert: true
        }
      };
    });

    const result = await Subscription.bulkWrite(operations);

    // Automatic Google Calendar bulk sync
    calendarSyncService.syncAllSubscriptions(userId, googleAccessToken).catch((err) => {
      console.warn('Background Google Calendar bulk sync notice:', err.message);
    });

    res.json({ success: true, count: operations.length, result });
  } catch (error) {
    console.error('Error in bulk subscriptions write:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/subscriptions/:id
 * Update an existing subscription strictly for the authenticated user
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;

    // Protect ownership: strip userId and primary key from payload to prevent tampering
    const updatePayload = { ...req.body };
    delete updatePayload.userId;
    delete updatePayload.id;
    delete updatePayload._id;

    const updated = await Subscription.findOneAndUpdate(
      { id: req.params.id, userId },
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Subscription not found for this user' });
    }

    // Automatic Google Calendar update
    calendarSyncService.syncSubscription(userId, req.params.id, req.body.googleAccessToken).catch((err) => {
      console.warn('Background Google Calendar sync notice:', err.message);
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating subscription in MongoDB:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/subscriptions/:id
 * Delete a single subscription strictly for the authenticated user
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;

    const deleted = await Subscription.findOneAndDelete({ id: req.params.id, userId });

    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found for this user' });
    }

    // Automatic Google Calendar deletion
    const token = req.query.googleAccessToken || req.body.googleAccessToken;
    calendarSyncService.deleteSubscriptionEvent(userId, req.params.id, token).catch((err) => {
      console.warn('Background Google Calendar delete notice:', err.message);
    });

    res.json({ success: true, id: req.params.id, message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription in MongoDB:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/subscriptions
 * Clear subscriptions ONLY for the authenticated user
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Subscription.deleteMany({ userId });

    // Automatic Google Calendar purge
    const token = req.query.googleAccessToken || req.body.googleAccessToken;
    calendarSyncService.deleteAllSubscriptionEvents(userId, token).catch((err) => {
      console.warn('Background Google Calendar clear notice:', err.message);
    });

    res.json({ success: true, deletedCount: result.deletedCount, userId });
  } catch (error) {
    console.error('Error clearing subscriptions in MongoDB:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
