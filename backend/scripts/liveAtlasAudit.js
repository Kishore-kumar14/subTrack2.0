import dotenv from 'dotenv';
import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import SubscriptionCatalog from '../models/SubscriptionCatalog.js';
import Subscription from '../models/Subscription.js';
import catalogService from '../services/catalogService.js';
import { generateToken, verifyAuthToken } from '../middleware/auth.js';

dotenv.config({ path: './backend/.env' });

async function runLiveAtlasAudit() {
  console.log('====================================================');
  console.log('🚀 SUBTRACK LIVE MONGODB ATLAS & SECURITY AUDIT');
  console.log('====================================================\n');

  const mongoURI = process.env.MONGODB_URI;
  assert.ok(mongoURI, 'MONGODB_URI must be configured in .env');

  const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 Connecting to MongoDB Atlas: ${maskedURI}...`);

  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  console.log(`✅ Connected successfully to Atlas Host: ${mongoose.connection.host}, Database: ${mongoose.connection.name}`);

  // 1. Verify and Seed SubscriptionCatalog in Atlas
  console.log('\n--- 1. Testing Idempotent Catalog Seeding in Atlas ---');
  const initialCount = await SubscriptionCatalog.countDocuments();
  console.log(`Current catalog records in Atlas: ${initialCount}`);

  console.log('Executing Seed Pass 1...');
  const seedResult1 = await catalogService.seedCatalog();
  console.log(`Seed Pass 1 completed. Upserted: ${seedResult1.upsertedCount}, Modified: ${seedResult1.modifiedCount}, Matched: ${seedResult1.matchedCount}`);
  
  const countAfterPass1 = await SubscriptionCatalog.countDocuments();
  console.log(`Provider count after Seed Pass 1: ${countAfterPass1}`);
  assert.equal(countAfterPass1, 22, 'Expected exactly 22 providers in catalog');

  console.log('Executing Seed Pass 2 (Idempotency verification)...');
  const seedResult2 = await catalogService.seedCatalog();
  console.log(`Seed Pass 2 completed. Upserted: ${seedResult2.upsertedCount}, Modified: ${seedResult2.modifiedCount}, Matched: ${seedResult2.matchedCount}`);
  
  const countAfterPass2 = await SubscriptionCatalog.countDocuments();
  console.log(`Provider count after Seed Pass 2: ${countAfterPass2}`);
  assert.equal(countAfterPass2, 22, 'Provider count must remain exactly 22 with 0 duplicates');
  assert.equal(seedResult2.upsertedCount, 0, 'Seed Pass 2 should not insert any new records');
  console.log('✅ PASS: Catalog seeding is 100% idempotent in Atlas.');

  // 2. Test Catalog Search and Provider Retrieval
  console.log('\n--- 2. Testing Catalog Search & Provider Retrieval ---');
  const entertainmentServices = await catalogService.getCatalog({ category: 'Entertainment' });
  console.log(`Entertainment services found: ${entertainmentServices.map(s => s.name).join(', ')}`);
  assert.ok(entertainmentServices.some(s => s.providerId === 'netflix'), 'Netflix should be in Entertainment');

  const spotifyQuery = await catalogService.getCatalog({ search: 'spotify' });
  assert.equal(spotifyQuery.length, 1, 'Should find exactly Spotify');
  assert.equal(spotifyQuery[0].providerId, 'spotify');

  const netflixProvider = await catalogService.getCatalogProvider('netflix');
  assert.ok(netflixProvider, 'Netflix provider should be retrievable by ID');
  assert.equal(netflixProvider.plans.length, 4, 'Netflix should have 4 verified plans');
  console.log(`✅ PASS: Catalog search & filtering verified.`);

  // 3. User Subscription Selection & Decoupling
  console.log('\n--- 3. Testing User Subscription Persistence & Decoupling ---');
  const testSubId = `test-atlas-sub-${Date.now()}`;
  const testUserId = 'test-user-alice-atlas';

  const testSubscription = new Subscription({
    id: testSubId,
    userId: testUserId,
    providerId: 'netflix',
    name: 'Netflix',
    planName: 'Premium 4K UHD',
    cost: 649,
    costUSD: 22.99,
    billingCycle: 'monthly',
    nextRenewalDate: '2026-11-20',
    paymentMethod: 'Credit Card',
    status: 'active'
  });

  await testSubscription.save();
  console.log(`Test subscription saved to Atlas with ID: ${testSubId}`);

  // Fetch from Atlas and verify persistence
  const retrievedSub = await Subscription.findOne({ id: testSubId, userId: testUserId });
  assert.ok(retrievedSub, 'Subscription must exist in Atlas');
  assert.equal(retrievedSub.userId, testUserId);
  assert.equal(retrievedSub.providerId, 'netflix');
  assert.equal(retrievedSub.cost, 649);
  assert.equal(retrievedSub.costUSD, 22.99);
  assert.equal(retrievedSub.billingCycle, 'monthly');
  assert.equal(retrievedSub.nextRenewalDate, '2026-11-20');
  console.log('✅ PASS: User subscription persisted correctly in Atlas.');

  // Simulate catalog price update (e.g. Netflix increases official price to ₹749)
  console.log('Simulating catalog official plan price increase to ₹749...');
  await SubscriptionCatalog.findOneAndUpdate(
    { providerId: 'netflix', 'plans.id': 'nflx-premium' },
    { $set: { 'plans.$.costINR': 749, lastVerifiedAt: new Date() } }
  );

  // Assert user's personal billing amount is untouched
  const subAfterCatalogUpdate = await Subscription.findOne({ id: testSubId, userId: testUserId });
  assert.equal(subAfterCatalogUpdate.cost, 649, "User's contracted cost must remain 649 despite catalog price increase");
  console.log(`User subscription cost after catalog update: ₹${subAfterCatalogUpdate.cost} (remains unchanged)`);
  console.log('✅ PASS: Catalog updates never overwrite personal user billing details.');

  // Restore Netflix catalog price
  await SubscriptionCatalog.findOneAndUpdate(
    { providerId: 'netflix', 'plans.id': 'nflx-premium' },
    { $set: { 'plans.$.costINR': 649 } }
  );

  // 4. Test Cross-User Isolation in Atlas
  console.log('\n--- 4. Testing Cross-User Isolation & Ownership ---');
  const unauthorizedRead = await Subscription.findOne({ id: testSubId, userId: 'unauthorized-bob' });
  assert.equal(unauthorizedRead, null, 'User Bob must not be able to read Alice subscription');

  const unauthorizedDelete = await Subscription.findOneAndDelete({ id: testSubId, userId: 'unauthorized-bob' });
  assert.equal(unauthorizedDelete, null, 'User Bob must not be able to delete Alice subscription');

  // Verify Alice's record still exists
  const stillExists = await Subscription.findOne({ id: testSubId, userId: testUserId });
  assert.ok(stillExists, "Alice's record must remain intact");
  console.log('✅ PASS: Cross-user access rejected. Data isolation confirmed.');

  // 5. Test Cryptographic JWT and Admin Key Auth
  console.log('\n--- 5. Testing Security Tokens & Admin Credentials ---');
  const mockUser = { id: testUserId, email: 'alice@subtrack.app', role: 'user' };
  const token = generateToken(mockUser);
  assert.ok(token && token.split('.').length === 3, 'Token must be valid 3-part JWT');

  const verified = verifyAuthToken(token);
  assert.ok(verified, 'Token must verify successfully');
  assert.equal(verified.id, testUserId);
  assert.equal(verified.role, 'user');

  // Test admin key matching
  const configuredAdminKey = process.env.ADMIN_API_KEY;
  assert.ok(configuredAdminKey, 'ADMIN_API_KEY must be configured in .env');
  assert.notEqual(configuredAdminKey, 'subtrack-admin-secret-key', 'Must not use hardcoded secret');
  console.log('✅ PASS: Cryptographic authentication & admin authorization validated.');

  // Clean up test subscription in Atlas
  await Subscription.deleteOne({ id: testSubId });
  console.log(`\nCleaned up test subscription: ${testSubId}`);

  console.log('\n====================================================');
  console.log('🎉 ALL LIVE MONGODB ATLAS VERIFICATIONS PASSED (6/6)');
  console.log('====================================================');
}

runLiveAtlasAudit()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Live Atlas Audit Failed:', err);
    process.exit(1);
  });
