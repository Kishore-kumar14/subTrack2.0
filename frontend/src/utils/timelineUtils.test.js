import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  formatDateKey,
  formatFriendlyDate,
  diffDays,
  calculateCycleStart,
  getSubscriptionBillingPeriod,
  getRenewalTimelineStatus,
  generateDateRange,
  calculateTimelinePositions,
  getOverlappingRenewals
} from './timelineUtils.js';

test('parseLocalDate parses valid ISO and YYYY-MM-DD correctly without timezone shift', () => {
  const d1 = parseLocalDate('2026-10-24');
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 9); // October is 9 (0-indexed)
  assert.equal(d1.getDate(), 24);

  const d2 = parseLocalDate('2026-02-28T14:30:00.000Z');
  assert.equal(d2.getFullYear(), 2026);
  assert.equal(d2.getMonth(), 1); // Feb
  assert.equal(d2.getDate(), 28);

  // Invalid strings return null
  assert.equal(parseLocalDate(''), null);
  assert.equal(parseLocalDate(null), null);
  assert.equal(parseLocalDate('invalid-date'), null);
});

test('calculateCycleStart steps back correctly for monthly, quarterly, yearly, weekly', () => {
  const nextMonthly = '2026-10-15';
  const startMonthly = calculateCycleStart(nextMonthly, 'monthly');
  assert.equal(startMonthly.getFullYear(), 2026);
  assert.equal(startMonthly.getMonth(), 8); // Sept
  assert.equal(startMonthly.getDate(), 15);

  const nextYearly = '2026-10-15';
  const startYearly = calculateCycleStart(nextYearly, 'yearly');
  assert.equal(startYearly.getFullYear(), 2025);
  assert.equal(startYearly.getMonth(), 9);
  assert.equal(startYearly.getDate(), 15);

  const nextWeekly = '2026-10-15';
  const startWeekly = calculateCycleStart(nextWeekly, 'weekly');
  assert.equal(startWeekly.getFullYear(), 2026);
  assert.equal(startWeekly.getMonth(), 9);
  assert.equal(startWeekly.getDate(), 8);
});

test('getSubscriptionBillingPeriod distinguishes verified from estimated cycle', () => {
  // Verified period with lastRenewedDate
  const verifiedSub = {
    id: 'sub-1',
    name: 'Netflix',
    nextRenewalDate: '2026-10-25',
    lastRenewedDate: '2026-09-25',
    billingCycle: 'monthly'
  };
  const verifiedRes = getSubscriptionBillingPeriod(verifiedSub);
  assert.equal(verifiedRes.hasValidDates, true);
  assert.equal(verifiedRes.isVerified, true);
  assert.equal(formatDateKey(verifiedRes.startDate), '2026-09-25');
  assert.equal(formatDateKey(verifiedRes.endDate), '2026-10-25');

  // Estimated period without recorded lastRenewedDate
  const unverifiedSub = {
    id: 'sub-2',
    name: 'Spotify',
    nextRenewalDate: '2026-10-20',
    billingCycle: 'monthly'
  };
  const unverifiedRes = getSubscriptionBillingPeriod(unverifiedSub);
  assert.equal(unverifiedRes.hasValidDates, true);
  assert.equal(unverifiedRes.isVerified, false);
  assert.equal(formatDateKey(unverifiedRes.startDate), '2026-09-20');
  assert.equal(formatDateKey(unverifiedRes.endDate), '2026-10-20');

  // Missing nextRenewalDate
  const invalidSub = { id: 'sub-3', name: 'Unknown' };
  const invalidRes = getSubscriptionBillingPeriod(invalidSub);
  assert.equal(invalidRes.hasValidDates, false);
});

test('getRenewalTimelineStatus accurately tags overdue, approaching, trial, and cancelled', () => {
  const today = parseLocalDate('2026-10-18');

  // Overdue: nextRenewalDate is in the past
  const overdueSub = { nextRenewalDate: '2026-10-15', status: 'active', reminderDays: 3 };
  const overdueStatus = getRenewalTimelineStatus(overdueSub, today);
  assert.equal(overdueStatus.isOverdue, true);
  assert.equal(overdueStatus.statusKey, 'overdue');
  assert.equal(overdueStatus.daysLeft, -3);

  // Approaching: 2 days left
  const approachingSub = { nextRenewalDate: '2026-10-20', status: 'active', reminderDays: 3 };
  const approachingStatus = getRenewalTimelineStatus(approachingSub, today);
  assert.equal(approachingStatus.isApproaching, true);
  assert.equal(approachingStatus.statusKey, 'approaching');
  assert.equal(approachingStatus.daysLeft, 2);

  // Active: 10 days left
  const activeSub = { nextRenewalDate: '2026-10-28', status: 'active', reminderDays: 3 };
  const activeStatus = getRenewalTimelineStatus(activeSub, today);
  assert.equal(activeStatus.statusKey, 'active');
  assert.equal(activeStatus.daysLeft, 10);

  // Free trial
  const trialSub = { trialEndDate: '2026-10-21', isFreeTrial: true, reminderDays: 3 };
  const trialStatus = getRenewalTimelineStatus(trialSub, today);
  assert.equal(trialStatus.statusKey, 'trial');

  // Cancelled
  const cancelledSub = { nextRenewalDate: '2026-10-20', status: 'cancelled' };
  const cancelledStatus = getRenewalTimelineStatus(cancelledSub, today);
  assert.equal(cancelledStatus.statusKey, 'cancelled');
});

test('calculateTimelinePositions calculates percentages and visible bounds', () => {
  const rangeStart = parseLocalDate('2026-10-01');
  const rangeDays = 30; // 30 days window: Oct 1 to Oct 31

  const subStart = parseLocalDate('2026-10-10');
  const subEnd = parseLocalDate('2026-10-20');

  const pos = calculateTimelinePositions(subStart, subEnd, rangeStart, rangeDays);
  assert.equal(pos.isBarVisible, true);
  assert.equal(pos.isMarkerVisible, true);
  // Oct 10 is 9 days after Oct 1 => 9/30 = 30%
  assert.ok(Math.abs(pos.barLeft - 30) < 0.1);
  // Oct 20 is 19 days after Oct 1 => duration 10 days => 10/30 = 33.33%
  assert.ok(Math.abs(pos.barWidth - 33.33) < 0.5);
  // Marker at Oct 20 => 19/30 = 63.33%
  assert.ok(Math.abs(pos.markerLeft - 63.33) < 0.5);
});

test('getOverlappingRenewals groups totals by currency without combining INR and USD directly', () => {
  const subs = [
    { id: '1', name: 'Netflix', nextRenewalDate: '2026-10-25', cost: 649, currency: 'INR' },
    { id: '2', name: 'Spotify', nextRenewalDate: '2026-10-25', cost: 119, currency: 'INR' },
    { id: '3', name: 'ChatGPT Plus', nextRenewalDate: '2026-10-25', cost: 20, costUSD: 20, currency: 'USD' },
    { id: '4', name: 'Prime', nextRenewalDate: '2026-10-28', cost: 299, currency: 'INR' }
  ];

  const overlaps = getOverlappingRenewals(subs, parseLocalDate('2026-10-01'), parseLocalDate('2026-10-31'));
  assert.equal(overlaps.length, 1);
  assert.equal(overlaps[0].dateKey, '2026-10-25');
  assert.equal(overlaps[0].count, 3);
  // INR total is 649 + 119 = 768
  assert.equal(overlaps[0].currencyTotals.INR, 768);
  // USD total is 20
  assert.equal(overlaps[0].currencyTotals.USD, 20);
});
