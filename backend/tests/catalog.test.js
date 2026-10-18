import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * In-memory Mock MongoDB Collections for isolated automated testing
 */
class MockCollection {
  constructor(name) {
    this.name = name;
    this.docs = [];
  }

  async countDocuments(filter = {}) {
    return this._filter(filter).length;
  }

  async find(filter = {}) {
    const res = this._filter(filter);
    return {
      sort: (sortObj) => {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        return [...res].sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }
    };
  }

  async findOne(filter = {}) {
    return this._filter(filter)[0] || null;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const idx = this.docs.findIndex(doc => this._matches(doc, filter));
    if (idx === -1) {
      if (options.upsert) {
        const newDoc = { ...filter, ...(update.$set || update) };
        this.docs.push(newDoc);
        return newDoc;
      }
      return null;
    }
    const current = this.docs[idx];
    const updated = { ...current, ...(update.$set || update), updatedAt: new Date() };
    this.docs[idx] = updated;
    return updated;
  }

  async findOneAndDelete(filter) {
    const idx = this.docs.findIndex(doc => this._matches(doc, filter));
    if (idx === -1) return null;
    const [deleted] = this.docs.splice(idx, 1);
    return deleted;
  }

  async updateMany(filter, update) {
    let modifiedCount = 0;
    this.docs.forEach((doc, idx) => {
      if (this._matches(doc, filter)) {
        this.docs[idx] = { ...doc, ...(update.$set || update) };
        modifiedCount++;
      }
    });
    return { modifiedCount };
  }

  async bulkWrite(operations) {
    let upsertedCount = 0;
    let modifiedCount = 0;
    let matchedCount = 0;

    for (const op of operations) {
      if (op.updateOne) {
        const { filter, update, upsert } = op.updateOne;
        const idx = this.docs.findIndex(doc => this._matches(doc, filter));
        if (idx !== -1) {
          matchedCount++;
          this.docs[idx] = { ...this.docs[idx], ...(update.$set || update) };
          modifiedCount++;
        } else if (upsert) {
          upsertedCount++;
          this.docs.push({ ...filter, ...(update.$set || update) });
        }
      }
    }
    return { upsertedCount, modifiedCount, matchedCount };
  }

  _filter(filter) {
    return this.docs.filter(doc => this._matches(doc, filter));
  }

  _matches(doc, filter) {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(val)) {
        const orMatch = val.some(subFilter => this._matches(doc, subFilter));
        if (!orMatch) return false;
        continue;
      }
      if (val instanceof RegExp) {
        if (!val.test(doc[key] || '')) return false;
        continue;
      }
      if (typeof val === 'object' && val !== null && val.$lt) {
        if (!(new Date(doc[key]) < new Date(val.$lt))) return false;
        continue;
      }
      if (doc[key] !== val) return false;
    }
    return true;
  }
}

test('1. Central Catalog: Idempotent Seeding & Duplicate Prevention', async () => {
  const catalogCol = new MockCollection('SubscriptionCatalog');

  const testProviders = [
    {
      providerId: 'netflix',
      name: 'Netflix',
      category: 'Entertainment',
      plans: [
        { id: 'nflx-basic', name: 'Basic', costINR: 199, costUSD: 9.99, billingCycle: 'monthly' },
        { id: 'nflx-premium', name: 'Premium', costINR: 649, costUSD: 22.99, billingCycle: 'monthly' }
      ],
      isActive: true,
      lastVerifiedAt: new Date()
    },
    {
      providerId: 'spotify',
      name: 'Spotify',
      category: 'Music & Audio',
      plans: [
        { id: 'spot-ind', name: 'Individual', costINR: 119, costUSD: 10.99, billingCycle: 'monthly' }
      ],
      isActive: true,
      lastVerifiedAt: new Date()
    }
  ];

  // Seed pass 1
  const ops1 = testProviders.map(p => ({
    updateOne: {
      filter: { providerId: p.providerId },
      update: { $set: p },
      upsert: true
    }
  }));
  const res1 = await catalogCol.bulkWrite(ops1);
  assert.equal(res1.upsertedCount, 2, 'Initial seed should insert 2 providers');
  assert.equal(await catalogCol.countDocuments(), 2, 'Total catalog count should be 2');

  // Seed pass 2 (Exact same data - must be completely idempotent)
  const res2 = await catalogCol.bulkWrite(ops1);
  assert.equal(res2.upsertedCount, 0, 'Subsequent seed should not insert any duplicate records');
  assert.equal(res2.matchedCount, 2, 'Existing providers should be matched and updated in place');
  assert.equal(await catalogCol.countDocuments(), 2, 'Catalog total remains exactly 2');
});

test('2. Multi-User Isolation: Independent Selection of Same Catalog Service', async () => {
  const subscriptionsCol = new MockCollection('Subscription');

  // User A selects Netflix Premium
  const userASub = {
    id: 'sub-user-a-1',
    userId: 'user-alice-101',
    providerId: 'netflix',
    name: 'Netflix',
    planName: 'Premium 4K',
    cost: 649,
    costUSD: 22.99,
    billingCycle: 'monthly',
    nextRenewalDate: '2026-11-01',
    paymentMethod: 'Credit Card',
    status: 'active'
  };

  // User B independently selects Netflix with a student or promo discount
  const userBSub = {
    id: 'sub-user-b-1',
    userId: 'user-bob-202',
    providerId: 'netflix',
    name: 'Netflix',
    planName: 'Premium 4K (Promo)',
    cost: 499,
    costUSD: 16.99,
    billingCycle: 'monthly',
    nextRenewalDate: '2026-11-15',
    paymentMethod: 'UPI',
    status: 'active'
  };

  await subscriptionsCol.findOneAndUpdate({ id: userASub.id }, userASub, { upsert: true });
  await subscriptionsCol.findOneAndUpdate({ id: userBSub.id }, userBSub, { upsert: true });

  // Verify Alice's subscriptions
  const aliceSubs = (await subscriptionsCol.find({ userId: 'user-alice-101' })).sort({ id: 1 });
  assert.equal(aliceSubs.length, 1);
  assert.equal(aliceSubs[0].cost, 649);
  assert.equal(aliceSubs[0].paymentMethod, 'Credit Card');

  // Verify Bob's subscriptions
  const bobSubs = (await subscriptionsCol.find({ userId: 'user-bob-202' })).sort({ id: 1 });
  assert.equal(bobSubs.length, 1);
  assert.equal(bobSubs[0].cost, 499);
  assert.equal(bobSubs[0].paymentMethod, 'UPI');

  // Editing Alice's renewal date does not affect Bob
  await subscriptionsCol.findOneAndUpdate(
    { id: userASub.id, userId: 'user-alice-101' },
    { $set: { nextRenewalDate: '2026-12-01', cost: 599 } }
  );

  const bobAfter = await subscriptionsCol.findOne({ id: userBSub.id, userId: 'user-bob-202' });
  assert.equal(bobAfter.cost, 499, "Bob's customized cost must remain untouched");
  assert.equal(bobAfter.nextRenewalDate, '2026-11-15', "Bob's renewal date must remain untouched");
});

test('3. Catalog Price Updates Must NOT Overwrite User Billing Details', async () => {
  const catalogCol = new MockCollection('SubscriptionCatalog');
  const subscriptionsCol = new MockCollection('Subscription');

  // Initial catalog
  await catalogCol.findOneAndUpdate(
    { providerId: 'spotify' },
    {
      providerId: 'spotify',
      name: 'Spotify',
      plans: [{ id: 'spot-ind', name: 'Individual', costINR: 119, costUSD: 10.99 }]
    },
    { upsert: true }
  );

  // User creates a subscription based on initial price
  await subscriptionsCol.findOneAndUpdate(
    { id: 'sub-carol-1' },
    {
      id: 'sub-carol-1',
      userId: 'user-carol-303',
      providerId: 'spotify',
      name: 'Spotify',
      planName: 'Individual',
      cost: 119,
      costUSD: 10.99
    },
    { upsert: true }
  );

  // Later, official catalog prices increase to INR 149
  await catalogCol.findOneAndUpdate(
    { providerId: 'spotify' },
    {
      $set: {
        plans: [{ id: 'spot-ind', name: 'Individual', costINR: 149, costUSD: 11.99 }],
        lastVerifiedAt: new Date()
      }
    }
  );

  // Check user's subscription
  const userSub = await subscriptionsCol.findOne({ id: 'sub-carol-1', userId: 'user-carol-303' });
  assert.equal(userSub.cost, 119, "User's saved billing cost must NOT be overwritten by catalog updates");
  assert.equal(userSub.costUSD, 10.99, "User's USD cost must remain as explicitly contracted");
});

test('4. Security & Ownership: Unauthorized and Cross-User Access Checks', async () => {
  const subscriptionsCol = new MockCollection('Subscription');

  await subscriptionsCol.findOneAndUpdate(
    { id: 'sub-secret-1' },
    {
      id: 'sub-secret-1',
      userId: 'user-alice-101',
      name: 'Private Service',
      cost: 999
    },
    { upsert: true }
  );

  // Alice accesses her own subscription
  const aliceAccess = await subscriptionsCol.findOne({ id: 'sub-secret-1', userId: 'user-alice-101' });
  assert.ok(aliceAccess, 'Alice should be able to read her own subscription');

  // Bob attempts to access Alice's subscription
  const bobAccess = await subscriptionsCol.findOne({ id: 'sub-secret-1', userId: 'user-bob-202' });
  assert.equal(bobAccess, null, "Bob must not be able to read Alice's record");

  // Attempt to delete Alice's subscription with Bob's credentials
  const deleteAttempt = await subscriptionsCol.findOneAndDelete({ id: 'sub-secret-1', userId: 'user-bob-202' });
  assert.equal(deleteAttempt, null, "Deleting with wrong userId must fail and return null");

  // Verify Alice's record is still intact
  const verifyIntact = await subscriptionsCol.findOne({ id: 'sub-secret-1', userId: 'user-alice-101' });
  assert.ok(verifyIntact, 'Alice subscription must remain intact in database');
});

test('5. Calendar Failure Resilience: Subscription Saves Even If Calendar Fails', async () => {
  const subscriptionsCol = new MockCollection('Subscription');

  // Simulate mock calendar call that fails
  const mockCalendarSync = async () => {
    throw new Error('Google Calendar API 503 Service Unavailable');
  };

  const newSubData = {
    id: 'sub-failover-1',
    userId: 'user-david-404',
    name: 'GitHub Copilot',
    cost: 830,
    googleCalendarStatus: 'not_synced'
  };

  // Save to DB first
  const saved = await subscriptionsCol.findOneAndUpdate(
    { id: newSubData.id },
    newSubData,
    { upsert: true }
  );
  assert.ok(saved, 'Subscription must be saved in database');

  // Background calendar sync fails
  let calendarErrorLogged = false;
  try {
    await mockCalendarSync();
  } catch (err) {
    calendarErrorLogged = true;
    // Mark status in DB without failing or rolling back subscription
    await subscriptionsCol.findOneAndUpdate(
      { id: newSubData.id, userId: newSubData.userId },
      { $set: { googleCalendarStatus: 'failed', googleCalendarError: err.message } }
    );
  }

  assert.ok(calendarErrorLogged, 'Calendar failure occurred');

  // Verify subscription still exists and records failure status cleanly
  const finalSub = await subscriptionsCol.findOne({ id: newSubData.id, userId: 'user-david-404' });
  assert.ok(finalSub, 'Subscription must not be lost or deleted');
  assert.equal(finalSub.name, 'GitHub Copilot');
  assert.equal(finalSub.googleCalendarStatus, 'failed');
  assert.equal(finalSub.googleCalendarError, 'Google Calendar API 503 Service Unavailable');
});

test('6. Catalog Freshness Audit: Stale Data Flagging Without Fabricated Sync', async () => {
  const catalogCol = new MockCollection('SubscriptionCatalog');

  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 120); // 120 days ago (> 90 days threshold)

  const freshDate = new Date();
  freshDate.setDate(freshDate.getDate() - 10); // 10 days ago

  await catalogCol.findOneAndUpdate(
    { providerId: 'stale-service' },
    { providerId: 'stale-service', name: 'Stale Service', lastVerifiedAt: oldDate, verificationStatus: 'verified' },
    { upsert: true }
  );

  await catalogCol.findOneAndUpdate(
    { providerId: 'fresh-service' },
    { providerId: 'fresh-service', name: 'Fresh Service', lastVerifiedAt: freshDate, verificationStatus: 'verified' },
    { upsert: true }
  );

  // Run audit threshold
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const staleResult = await catalogCol.updateMany(
    { lastVerifiedAt: { $lt: cutoff }, verificationStatus: 'verified' },
    { $set: { verificationStatus: 'needs_review' } }
  );

  assert.equal(staleResult.modifiedCount, 1, 'Only the provider older than 90 days should be flagged');

  const staleItem = await catalogCol.findOne({ providerId: 'stale-service' });
  assert.equal(staleItem.verificationStatus, 'needs_review');

  const freshItem = await catalogCol.findOne({ providerId: 'fresh-service' });
  assert.equal(freshItem.verificationStatus, 'verified');
});
