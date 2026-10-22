import express from 'express';
import Subscription from '../models/Subscription.js';
import { isDBConnected } from '../config/db.js';
import calendarSyncService from '../services/calendarSyncService.js';

const router = express.Router();

/**
 * Format Date to iCalendar YYYYMMDD format
 */
function formatICalDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/-/g, '').slice(0, 8);
  if (/^\d{8}$/.test(clean)) return clean;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Escape text for iCalendar RFC 5545
 */
function escapeICalText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * POST /api/calendar/connect
 * Stores Google Calendar OAuth access credentials on backend and triggers initial sync
 */
router.post('/connect', async (req, res) => {
  try {
    const { userId, accessToken, refreshToken, expiresIn } = req.body;
    if (!userId || !accessToken) {
      return res.status(400).json({ error: 'userId and accessToken are required to connect Google Calendar' });
    }

    const result = await calendarSyncService.connectUserCalendar(userId, {
      accessToken,
      refreshToken,
      expiresIn
    });

    res.json(result);
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/disconnect
 * Disconnects Google Calendar integration for a user
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await calendarSyncService.disconnectUserCalendar(userId);
    res.json(result);
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/status
 * Get current Google Calendar connection and synchronization status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const status = await calendarSyncService.getSyncStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching calendar status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/reconcile
 * Idempotently reconciles Google Calendar with SubTrack:
 * - Updates existing events
 * - Creates missing events
 * - Identifies and removes duplicate events
 * - Cleans up orphaned events
 */
router.post('/reconcile', async (req, res) => {
  try {
    const { userId, accessToken } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required to reconcile calendar' });
    }

    const result = await calendarSyncService.reconcileCalendar(userId, accessToken);
    res.json(result);
  } catch (error) {
    console.error('Error reconciling calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/sync
 * Sync all active subscriptions for a user
 */
router.post('/sync', async (req, res) => {
  try {
    const { userId, accessToken } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required to sync calendar' });
    }

    const result = await calendarSyncService.syncAllSubscriptions(userId, accessToken);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/calendar/sync:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calendar/direct-sync
 * Backward-compatible endpoint for direct sync from client.
 * Now completely idempotent: updates existing mapped events, prevents duplicate insertions,
 * and records event mappings in MongoDB.
 */
router.post('/direct-sync', async (req, res) => {
  try {
    const { accessToken, subscriptions, userId } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Google OAuth access token is required' });
    }

    // Determine target userId
    const targetUserId = userId || (Array.isArray(subscriptions) && subscriptions[0]?.userId);
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required for direct synchronization' });
    }

    // Persist connection if not yet connected
    await calendarSyncService.connectUserCalendar(targetUserId, {
      accessToken,
      expiresIn: 3600
    }).catch(() => {});

    // Run reconciliation and synchronization
    const reconcileResult = await calendarSyncService.reconcileCalendar(targetUserId, accessToken);

    res.json({
      success: true,
      count: reconcileResult.reconciledCount,
      message: reconcileResult.message,
      duplicatesRemoved: reconcileResult.duplicatesRemoved,
      orphansRemoved: reconcileResult.orphansRemoved
    });
  } catch (error) {
    console.error('Error in /api/calendar/direct-sync:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calendar/:userId/feed.ics
 * Live iCalendar subscription feed for Google Calendar, Outlook, Apple Calendar
 * Refreshes periodically on standard calendar app polling schedule
 */
router.get('/:userId/feed.ics', async (req, res) => {
  try {
    const { userId } = req.params;

    let subscriptions = [];
    if (isDBConnected()) {
      subscriptions = await Subscription.find({
        userId,
        status: { $in: ['active', 'trial'] }
      });
    }

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SubTrack//SubTrack Calendar 2.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:SubTrack Subscription Renewals',
      'X-WR-CALDESC:Automatic renewal reminders and payment dates from SubTrack',
      'X-WR-TIMEZONE:UTC',
      'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
      'X-PUBLISHED-TTL:PT6H'
    ];

    for (const sub of subscriptions) {
      const renewalDate = sub.nextRenewalDate || sub.firstBillingDate;
      const formattedDate = formatICalDate(renewalDate);
      if (!formattedDate) continue;

      const symbol = sub.currency === 'USD' ? '$' : '₹';
      const cost = sub.cost || sub.costUSD || 0;
      const summary = `🔔 Renewal: ${sub.name} (${symbol}${cost})`;
      const desc = `Service: ${sub.name}\\nPlan: ${sub.planName || 'Standard'}\\nCost: ${symbol}${cost}\\nBilling: ${sub.billingCycle}\\nPayment: ${sub.paymentMethod}\\nCategory: ${sub.category}${sub.notes ? '\\nNotes: ' + escapeICalText(sub.notes) : ''}`;

      let rrule = '';
      if (sub.billingCycle === 'monthly') {
        rrule = 'RRULE:FREQ=MONTHLY';
      } else if (sub.billingCycle === 'yearly') {
        rrule = 'RRULE:FREQ=YEARLY';
      } else if (sub.billingCycle === 'quarterly') {
        rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3';
      } else if (sub.billingCycle === 'weekly') {
        rrule = 'RRULE:FREQ=WEEKLY';
      }

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:subtrack-${sub.id}@subtrack.app`);
      icsContent.push(`DTSTAMP:${nowStr}`);
      icsContent.push(`DTSTART;VALUE=DATE:${formattedDate}`);
      icsContent.push(`DTEND;VALUE=DATE:${formattedDate}`);
      icsContent.push(`SUMMARY:${escapeICalText(summary)}`);
      icsContent.push(`DESCRIPTION:${desc}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('TRANSP:TRANSPARENT');
      if (rrule) icsContent.push(rrule);

      // Mobile Push Notification Alarm: 3 days in advance
      icsContent.push('BEGIN:VALARM');
      icsContent.push('ACTION:DISPLAY');
      icsContent.push(`DESCRIPTION:Upcoming Renewal: ${escapeICalText(sub.name)} renews in 3 days (${symbol}${cost})`);
      icsContent.push('TRIGGER:-P3D');
      icsContent.push('END:VALARM');

      // Mobile Push Notification Alarm: 1 day in advance
      icsContent.push('BEGIN:VALARM');
      icsContent.push('ACTION:DISPLAY');
      icsContent.push(`DESCRIPTION:Upcoming Renewal: ${escapeICalText(sub.name)} renews tomorrow! (${symbol}${cost})`);
      icsContent.push('TRIGGER:-P1D');
      icsContent.push('END:VALARM');

      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');
    const finalIcs = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="subtrack-renewals-${userId}.ics"`);
    res.send(finalIcs);
  } catch (err) {
    console.error('Error generating iCal feed:', err);
    res.status(500).send('Error generating calendar feed');
  }
});

/**
 * GET /api/calendar/google-url
 * Generates single-event Google Calendar web template URL
 */
router.get('/google-url', (req, res) => {
  const { name, cost, date, cycle, planName, category, notes, currency } = req.query;
  const formattedDate = formatICalDate(date);
  if (!formattedDate) {
    return res.status(400).json({ error: 'Valid date is required' });
  }

  const symbol = currency === 'USD' ? '$' : '₹';
  const title = encodeURIComponent(`🔔 Renewal: ${name} (${symbol}${cost})`);
  const details = encodeURIComponent(
    `SubTrack Renewal Reminder\n\nService: ${name}\nPlan: ${planName || 'Standard'}\nAmount: ${symbol}${cost}\nBilling: ${cycle || 'monthly'}\nCategory: ${category || 'General'}${notes ? '\nNotes: ' + notes : ''}\n\nManaged in SubTrack`
  );

  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  const nextDay = formatICalDate(d.toISOString().split('T')[0]);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formattedDate}/${nextDay}&details=${details}&recur=RRULE:FREQ=${(cycle || 'monthly').toUpperCase()}`;

  res.json({ url: googleUrl });
});

export default router;
