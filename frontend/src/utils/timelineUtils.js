/**
 * SubTrack Renewal Timeline Utilities
 * Handles date normalization, range generation, Gantt coordinates,
 * status calculation, and overlapping renewals grouping.
 */

/**
 * Safely parse a date string (YYYY-MM-DD or ISO) into a local Date set to 00:00:00.
 * Returns null if invalid.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  try {
    // If string has 'T', extract the date part first to avoid timezone shift
    const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
    const parts = cleanStr ? cleanStr.split('-') : [];
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  } catch (e) {
    console.warn('Error parsing date:', dateStr, e);
  }
  return null;
}

/**
 * Format a Date to YYYY-MM-DD
 */
export function formatDateKey(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for user display: "Oct 24, 2026" or "Oct 24"
 */
export function formatFriendlyDate(dateStr, includeYear = true) {
  const d = parseLocalDate(dateStr);
  if (!d) return '—';
  const options = { month: 'short', day: 'numeric' };
  if (includeYear) options.year = 'numeric';
  return d.toLocaleDateString('en-US', options);
}

/**
 * Difference in calendar days between two dates (b - a)
 */
export function diffDays(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateB - dateA) / msPerDay);
}

/**
 * Determine cycle duration in days roughly or step back from next renewal date
 */
export function getCycleDurationDays(billingCycle) {
  switch (billingCycle) {
    case 'weekly':
      return 7;
    case 'quarterly':
      return 91;
    case 'yearly':
      return 365;
    case 'monthly':
    default:
      return 30;
  }
}

/**
 * Calculate the prior cycle start date based on next renewal date and cycle.
 */
export function calculateCycleStart(nextRenewalDate, billingCycle) {
  const next = parseLocalDate(nextRenewalDate);
  if (!next) return null;

  const start = new Date(next);
  if (billingCycle === 'yearly') {
    start.setFullYear(start.getFullYear() - 1);
  } else if (billingCycle === 'quarterly') {
    start.setMonth(start.getMonth() - 3);
  } else if (billingCycle === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else {
    // Default monthly
    start.setMonth(start.getMonth() - 1);
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Compute the billing period start and end for a subscription.
 * Distinguishes whether the period start is verified by actual database record
 * (lastRenewedDate or firstBillingDate) or estimated from cycle rules.
 */
export function getSubscriptionBillingPeriod(sub) {
  const nextDateStr = sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate;
  const nextDate = parseLocalDate(nextDateStr);

  if (!nextDate) {
    return {
      hasValidDates: false,
      startDate: null,
      endDate: null,
      isVerified: false
    };
  }

  // Check verified dates in subscription model
  let verifiedStart = null;
  if (sub.lastRenewedDate) {
    const lrd = parseLocalDate(sub.lastRenewedDate);
    if (lrd && lrd < nextDate) {
      verifiedStart = lrd;
    }
  }

  if (!verifiedStart && sub.firstBillingDate) {
    const fbd = parseLocalDate(sub.firstBillingDate);
    if (fbd && fbd < nextDate) {
      verifiedStart = fbd;
    }
  }

  if (verifiedStart) {
    return {
      hasValidDates: true,
      startDate: verifiedStart,
      endDate: nextDate,
      isVerified: true
    };
  }

  // Estimated period from billing cycle
  const estimatedStart = calculateCycleStart(nextDateStr, sub.billingCycle || 'monthly');
  return {
    hasValidDates: true,
    startDate: estimatedStart,
    endDate: nextDate,
    isVerified: false
  };
}

/**
 * Compute renewal status for timeline visualization.
 * Returns: { statusKey, label, color, badgeType, daysLeft, isOverdue, isApproaching }
 */
export function getRenewalTimelineStatus(sub, today) {
  if (sub.status === 'cancelled') {
    return {
      statusKey: 'cancelled',
      label: 'Cancelled',
      color: 'var(--text-muted)',
      badgeType: 'secondary',
      daysLeft: null,
      isOverdue: false,
      isApproaching: false
    };
  }

  if (sub.status === 'paused') {
    return {
      statusKey: 'paused',
      label: 'Paused',
      color: 'var(--accent-amber)',
      badgeType: 'amber',
      daysLeft: null,
      isOverdue: false,
      isApproaching: false
    };
  }

  const targetDateStr = sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate;
  const renewalDate = parseLocalDate(targetDateStr);

  if (!renewalDate) {
    return {
      statusKey: 'no_date',
      label: 'No Date',
      color: 'var(--text-muted)',
      badgeType: 'secondary',
      daysLeft: null,
      isOverdue: false,
      isApproaching: false
    };
  }

  const daysLeft = diffDays(today, renewalDate);

  if (sub.isFreeTrial || sub.status === 'trial') {
    return {
      statusKey: 'trial',
      label: daysLeft <= 0 ? 'Trial Ended' : `Trial Ends (${daysLeft}d)`,
      color: 'var(--accent-amber)',
      badgeType: 'amber',
      daysLeft,
      isOverdue: daysLeft < 0,
      isApproaching: daysLeft >= 0 && daysLeft <= (sub.reminderDays || 3)
    };
  }

  if (daysLeft < 0) {
    return {
      statusKey: 'overdue',
      label: `Overdue (${Math.abs(daysLeft)}d)`,
      color: 'var(--accent-rose)',
      badgeType: 'rose',
      daysLeft,
      isOverdue: true,
      isApproaching: false
    };
  }

  if (daysLeft <= (sub.reminderDays || 3)) {
    return {
      statusKey: 'approaching',
      label: daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `Due in ${daysLeft}d`,
      color: 'var(--accent-amber)',
      badgeType: 'amber',
      daysLeft,
      isOverdue: false,
      isApproaching: true
    };
  }

  return {
    statusKey: 'active',
    label: `Renews in ${daysLeft}d`,
    color: 'var(--accent-emerald)',
    badgeType: 'emerald',
    daysLeft,
    isOverdue: false,
    isApproaching: false
  };
}

/**
 * Generate date range window
 * @param {Date} startDate
 * @param {number} totalDays
 */
export function generateDateRange(startDate, totalDays) {
  const days = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

/**
 * Calculate horizontal timeline coordinate percentages:
 * - barLeft: percentage from left (0 to 100)
 * - barWidth: percentage width (0 to 100)
 * - markerLeft: percentage where next renewal milestone sits (0 to 100)
 * - isMarkerVisible: boolean
 * - isBarVisible: boolean
 */
export function calculateTimelinePositions(startDate, endDate, rangeStartDate, rangeTotalDays) {
  const rangeStartMs = rangeStartDate.getTime();
  const rangeDurationMs = rangeTotalDays * 24 * 60 * 60 * 1000;
  const rangeEndMs = rangeStartMs + rangeDurationMs;

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // If entire bar is outside visible range
  if (endMs < rangeStartMs || startMs > rangeEndMs) {
    return {
      barLeft: 0,
      barWidth: 0,
      markerLeft: null,
      isBarVisible: false,
      isMarkerVisible: false
    };
  }

  const clampedStartMs = Math.max(startMs, rangeStartMs);
  const clampedEndMs = Math.min(endMs, rangeEndMs);

  const barLeft = ((clampedStartMs - rangeStartMs) / rangeDurationMs) * 100;
  const barWidth = Math.max(0.5, ((clampedEndMs - clampedStartMs) / rangeDurationMs) * 100);

  // Marker is positioned at endMs (renewal date)
  let markerLeft = null;
  let isMarkerVisible = false;
  if (endMs >= rangeStartMs && endMs <= rangeEndMs) {
    markerLeft = ((endMs - rangeStartMs) / rangeDurationMs) * 100;
    isMarkerVisible = true;
  }

  return {
    barLeft,
    barWidth,
    markerLeft,
    isBarVisible: true,
    isMarkerVisible
  };
}

/**
 * Identify dates with overlapping renewals and group expected expenses by currency.
 * Returns array of:
 * {
 *   dateKey: 'YYYY-MM-DD',
 *   date: Date,
 *   subscriptions: [...],
 *   count: number,
 *   currencyTotals: { INR: 1200, USD: 15 } // Grouped separately!
 * }
 */
export function getOverlappingRenewals(subscriptions, rangeStartDate, rangeEndDate) {
  const map = {};

  subscriptions.forEach(sub => {
    if (sub.status === 'cancelled' || sub.status === 'paused') return;
    const targetDateStr = sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate;
    const d = parseLocalDate(targetDateStr);
    if (!d) return;

    if (rangeStartDate && d < rangeStartDate) return;
    if (rangeEndDate && d > rangeEndDate) return;

    const key = formatDateKey(d);
    if (!map[key]) {
      map[key] = {
        dateKey: key,
        date: d,
        subscriptions: [],
        count: 0,
        currencyTotals: { INR: 0, USD: 0, other: 0 }
      };
    }

    map[key].subscriptions.push(sub);
    map[key].count += 1;

    // Detect currency of subscription
    // SubTrack subscriptions have cost (in INR default), or costUSD
    const cost = Number(sub.cost) || 0;
    const costUSD = Number(sub.costUSD) || 0;

    // Check if subscription has explicit currency field or costUSD
    if (sub.currency === 'USD' || (costUSD > 0 && cost === 0)) {
      map[key].currencyTotals.USD += costUSD || cost;
    } else {
      map[key].currencyTotals.INR += cost;
      if (costUSD > 0) {
        map[key].currencyTotals.USD += costUSD;
      }
    }
  });

  return Object.values(map)
    .filter(item => item.count > 1)
    .sort((a, b) => a.date - b.date);
}
