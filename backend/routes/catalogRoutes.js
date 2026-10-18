import express from 'express';
import catalogService from '../services/catalogService.js';
import SubscriptionCatalog from '../models/SubscriptionCatalog.js';
import { isDBConnected } from '../config/db.js';

const router = express.Router();

// Middleware to check DB connection
const checkDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      error: 'MongoDB is not connected. Please ensure MongoDB is running.'
    });
  }
  next();
};

import { authenticateToken } from '../middleware/auth.js';

// Administrative authorization middleware
const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    // 1. Check if user is authenticated via JWT with admin role
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Check explicit ADMIN_API_KEY from environment
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const configuredKey = process.env.ADMIN_API_KEY;

    if (configuredKey && adminKey && adminKey === configuredKey) {
      return next();
    }

    return res.status(403).json({
      error: 'Administrative authorization required for catalog modification operations.'
    });
  });
};

/**
 * GET /api/catalog
 * Retrieve public catalog of subscription services from MongoDB Atlas.
 * Supports ?search=... &category=... &activeOnly=true
 */
router.get('/', checkDB, async (req, res) => {
  try {
    const { search, category, activeOnly } = req.query;

    // Check if catalog has been initialized; if 0 entries, run idempotent seed
    const count = await SubscriptionCatalog.countDocuments();
    if (count === 0) {
      await catalogService.seedCatalog();
    }

    const catalog = await catalogService.getCatalog({
      search,
      category,
      activeOnly: activeOnly !== 'false'
    });

    res.json(catalog);
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/:providerId
 * Retrieve a single service provider with all its verified plans
 */
router.get('/:providerId', checkDB, async (req, res) => {
  try {
    const provider = await catalogService.getCatalogProvider(req.params.providerId);
    if (!provider) {
      return res.status(404).json({ error: `Provider '${req.params.providerId}' not found in catalog` });
    }
    res.json(provider);
  } catch (error) {
    console.error('Error fetching catalog provider:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/seed
 * Idempotently seed or re-seed catalog in MongoDB Atlas
 * Protected by administrative authorization
 */
router.post('/seed', checkDB, async (req, res, next) => {
  // Allow seed without key ONLY if collection is currently completely empty
  const count = await SubscriptionCatalog.countDocuments();
  if (count === 0) {
    return next();
  }
  return requireAdmin(req, res, next);
}, async (req, res) => {
  try {
    const customData = req.body.providers || null;
    const result = await catalogService.seedCatalog(customData);
    res.json({
      success: true,
      message: 'Subscription catalog seeded idempotently in MongoDB Atlas',
      ...result
    });
  } catch (error) {
    console.error('Error seeding subscription catalog:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/refresh
 * Refresh catalog data freshness and audit verification timestamps
 * Protected by administrative authorization
 */
router.post('/refresh', checkDB, requireAdmin, async (req, res) => {
  try {
    const result = await catalogService.refreshCatalogFreshness();
    res.json(result);
  } catch (error) {
    console.error('Error refreshing catalog freshness:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/catalog/:providerId
 * Update service metadata or plans in the shared catalog
 * Protected by administrative authorization
 */
router.put('/:providerId', checkDB, requireAdmin, async (req, res) => {
  try {
    const updated = await catalogService.updateCatalogProvider(req.params.providerId, req.body);
    res.json({
      success: true,
      message: `Catalog entry '${req.params.providerId}' updated successfully`,
      provider: updated
    });
  } catch (error) {
    console.error('Error updating catalog provider:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
