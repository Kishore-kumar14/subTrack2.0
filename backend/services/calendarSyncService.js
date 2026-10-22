import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Format a Date or date string to YYYY-MM-DD
 */
function toISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build Google Calendar Event payload with reminders and metadata
 */
function buildEventPayload(sub, userId) {
  const renewalDate = sub.nextRenewalDate || sub.firstBillingDate;
  const startDate = toISODate(renewalDate);
  if (!startDate) return null;

  const d = new Date(startDate);
  d.setDate(d.getDate() + 1);
  const endDate = toISODate(d.toISOString().split('T')[0]);

  let rrule = null;
  if (sub.billingCycle === 'monthly') {
    rrule = 'RRULE:FREQ=MONTHLY';
  } else if (sub.billingCycle === 'yearly') {
    rrule = 'RRULE:FREQ=YEARLY';
  } else if (sub.billingCycle === 'quarterly') {
    rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=3';
  } else if (sub.billingCycle === 'weekly') {
    rrule = 'RRULE:FREQ=WEEKLY';
  }

  const symbol = sub.currency === 'USD' ? '$' : '₹';
  const cost = sub.cost || sub.costUSD || 0;

  const payload = {
    summary: `🔔 ${sub.name} Renewal (${symbol}${cost})`,
    description: `SubTrack Renewal Reminder\n\nService: ${sub.name}\nPlan: ${sub.planName || 'Standard'}\nAmount: ${symbol}${cost}\nBilling Cycle: ${sub.billingCycle || 'monthly'}\nCategory: ${sub.category || 'Other'}\nPayment Method: ${sub.paymentMethod || 'Credit Card'}${sub.notes ? '\nNotes: ' + sub.notes : ''}\n\nManaged automatically by SubTrack`,
    start: { date: startDate },
    end: { date: endDate },
    transparency: 'transparent',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 4320 }, // 3 days before renewal
        { method: 'popup', minutes: 1440 }  // 1 day before renewal
      ]
    },
    extendedProperties: {
      private: {
        subtrackSubscriptionId: String(sub.id),
        subtrackUserId: String(userId),
        subtrackManaged: 'true'
      }
    }
  };

  if (rrule) {
    payload.recurrence = [rrule];
  }

  return payload;
}

export async function findUser(userId) {
  if (!userId) return null;
  const rawId = String(userId).trim();
  const strippedGoogleId = rawId.replace(/^usr-g-/, '').replace(/^g-/, '');

  return await User.findOne({
    $or: [
      { id: rawId },
      { googleId: rawId },
      { googleId: strippedGoogleId },
      { id: `usr-g-${strippedGoogleId}` },
      { email: rawId.toLowerCase() }
    ]
  });
}

/**
 * Retrieve user and active Google OAuth access token
 */
async function getUserCredentials(userId, explicitToken = null) {
  if (explicitToken) {
    return { accessToken: explicitToken, calendarId: 'primary' };
  }

  const user = await findUser(userId);
  if (!user || !user.googleCalendar || !user.googleCalendar.connected) {
    return null;
  }

  const { accessToken, refreshToken, expiryDate, calendarId = 'primary' } = user.googleCalendar;

  // Check if token expired and refresh token is available
  const now = Date.now();
  if (expiryDate && now >= expiryDate - 60000 && refreshToken) {
    try {
      googleClient.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await googleClient.refreshAccessToken();
      user.googleCalendar.accessToken = credentials.access_token;
      if (credentials.expiry_date) {
        user.googleCalendar.expiryDate = credentials.expiry_date;
      }
      await user.save();
      return { accessToken: credentials.access_token, calendarId };
    } catch (refreshErr) {
      console.warn(`Could not refresh Google OAuth token for user ${userId}:`, refreshErr.message);
      user.googleCalendar.syncStatus = 'error';
      user.googleCalendar.lastError = 'Token refresh failed. Please reconnect Google Calendar.';
      await user.save();
      return null;
    }
  }

  if (!accessToken) return null;
  return { accessToken, calendarId };
}

export const calendarSyncService = {
  /**
   * Connect and store Google Calendar credentials for a user
   */
  async connectUserCalendar(userId, { accessToken, refreshToken, expiresIn }) {
    let user = await findUser(userId);

    // If user is not yet in MongoDB, attempt resolution via Google UserInfo API or auto-provision
    if (!user) {
      let googleProfile = null;
      if (accessToken) {
        try {
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (gRes.ok) {
            googleProfile = await gRes.json();
          }
        } catch (e) {
          console.warn('Could not query Google userinfo for auto-provisioning:', e.message);
        }
      }

      if (googleProfile) {
        if (googleProfile.email) {
          user = await User.findOne({ email: googleProfile.email.toLowerCase() });
        }
        if (!user && googleProfile.sub) {
          user = await User.findOne({ googleId: googleProfile.sub });
        }
      }

      if (!user) {
        const rawId = String(userId || `usr-g-${Date.now()}`).trim();
        const strippedGoogleId = rawId.replace(/^usr-g-/, '').replace(/^g-/, '');
        const userEmail = googleProfile?.email?.toLowerCase() || (rawId.includes('@') ? rawId.toLowerCase() : `${rawId}@subtrack.app`);
        const userName = googleProfile?.name || userEmail.split('@')[0] || 'SubTrack User';
        const userAvatar = googleProfile?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

        user = new User({
          id: rawId,
          googleId: googleProfile?.sub || strippedGoogleId || null,
          name: userName,
          email: userEmail,
          avatar: userAvatar,
          currency: 'INR',
          monthlyBudget: 8000,
          joinedDate: new Date().toISOString().split('T')[0],
          preferences: {
            browserAlerts: true,
            emailAlerts: true,
            alertDaysBefore: 3,
            weeklyReport: true
          }
        });
        await user.save();
      }
    }

    const expiryDate = expiresIn ? Date.now() + expiresIn * 1000 : null;

    user.googleCalendar = {
      connected: true,
      accessToken,
      refreshToken: refreshToken || user.googleCalendar?.refreshToken || null,
      expiryDate,
      calendarId: 'primary',
      lastSyncedAt: new Date(),
      syncStatus: 'connected',
      lastError: null
    };

    await user.save();

    // Trigger initial idempotent synchronization of all user subscriptions
    this.syncAllSubscriptions(user.id || userId, accessToken).catch((err) => {
      console.warn('Initial sync notice for user:', user.id || userId, err.message);
    });

    return { success: true, message: 'Google Calendar connected successfully' };
  },

  /**
   * Disconnect Google Calendar
   */
  async disconnectUserCalendar(userId) {
    const user = await findUser(userId);
    if (!user) {
      return { success: true, message: 'Google Calendar disconnected' };
    }

    if (user.googleCalendar) {
      user.googleCalendar.connected = false;
      user.googleCalendar.accessToken = null;
      user.googleCalendar.refreshToken = null;
      user.googleCalendar.syncStatus = 'disconnected';
      await user.save();
    }

    return { success: true, message: 'Google Calendar disconnected' };
  },

  /**
   * Sync a single subscription to Google Calendar idempotently.
   * - If already mapped, update existing event (PATCH).
   * - If mapped event was deleted in GCal (404), recreate and update mapping.
   * - If no mapping, search by privateExtendedProperty first before inserting to avoid duplicates.
   * - If cancelled/paused, remove event.
   */
  async syncSubscription(userId, subscriptionId, explicitToken = null) {
    try {
      const user = await findUser(userId);
      const userIds = Array.from(new Set([userId, user?.id, user?.googleId].filter(Boolean)));
      const sub = await Subscription.findOne({ id: subscriptionId, userId: { $in: userIds } });
      if (!sub) return { skipped: true, reason: 'Subscription not found' };

      const creds = await getUserCredentials(userId, explicitToken);
      if (!creds || !creds.accessToken) {
        // User has not connected Google Calendar: mark as not_synced safely
        await Subscription.updateOne(
          { id: subscriptionId, userId: { $in: userIds } },
          { $set: { googleCalendarStatus: 'not_synced' } }
        );
        return { skipped: true, reason: 'Google Calendar not connected' };
      }

      const { accessToken, calendarId } = creds;

      // If subscription is cancelled or paused, delete any existing Google Calendar event
      if (sub.status === 'cancelled' || sub.status === 'paused') {
        if (sub.googleCalendarEventId) {
          await this.deleteSubscriptionEvent(userId, subscriptionId, accessToken);
        }
        await Subscription.updateOne(
          { id: subscriptionId, userId },
          {
            $set: {
              googleCalendarEventId: null,
              googleCalendarStatus: 'synced',
              googleCalendarSyncedAt: new Date(),
              googleCalendarError: null
            }
          }
        );
        return { success: true, action: 'removed_inactive_event' };
      }

      const eventPayload = buildEventPayload(sub, userId);
      if (!eventPayload) {
        return { skipped: true, reason: 'No valid renewal date configured' };
      }

      let eventId = sub.googleCalendarEventId;

      // 1. If we already have a mapped event ID, attempt to update it
      if (eventId) {
        const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
        const updateRes = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (updateRes.ok) {
          const updatedEvent = await updateRes.json();
          await Subscription.updateOne(
            { id: subscriptionId, userId },
            {
              $set: {
                googleCalendarStatus: 'synced',
                googleCalendarSyncedAt: new Date(),
                googleCalendarError: null
              }
            }
          );
          return { success: true, action: 'updated', eventId: updatedEvent.id };
        }

        // If 404, event was deleted outside SubTrack. Recreate it below.
        if (updateRes.status !== 404) {
          const errData = await updateRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || updateRes.statusText;
          await Subscription.updateOne(
            { id: subscriptionId, userId },
            { $set: { googleCalendarStatus: 'failed', googleCalendarError: errMsg } }
          );
          return { success: false, error: errMsg };
        }
      }

      // 2. No mapped event ID or event was 404'd:
      // Search Google Calendar by privateExtendedProperty to check for existing unlinked event
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=subtrackSubscriptionId%3D${encodeURIComponent(sub.id)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const existingItems = Array.isArray(searchData.items)
          ? searchData.items.filter((item) => item.status !== 'cancelled')
          : [];

        if (existingItems.length > 0) {
          // Found existing event(s)! Take the first one and remove any duplicate extras
          const primaryEvent = existingItems[0];
          eventId = primaryEvent.id;

          // Delete duplicate extra events if more than 1 existed
          if (existingItems.length > 1) {
            for (let i = 1; i < existingItems.length; i++) {
              const dupId = existingItems[i].id;
              fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(dupId)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              }).catch(() => {});
            }
          }

          // Update primary event with latest details
          const updateRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPayload)
          });

          if (updateRes.ok) {
            await Subscription.updateOne(
              { id: subscriptionId, userId },
              {
                $set: {
                  googleCalendarEventId: eventId,
                  googleCalendarStatus: 'synced',
                  googleCalendarSyncedAt: new Date(),
                  googleCalendarError: null
                }
              }
            );
            return { success: true, action: 'reassociated_and_updated', eventId };
          }
        }
      }

      // 3. Create new event
      const createUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || createRes.statusText;
        await Subscription.updateOne(
          { id: subscriptionId, userId },
          { $set: { googleCalendarStatus: 'failed', googleCalendarError: errMsg } }
        );
        return { success: false, error: errMsg };
      }

      const createdEvent = await createRes.json();
      await Subscription.updateOne(
        { id: subscriptionId, userId },
        {
          $set: {
            googleCalendarEventId: createdEvent.id,
            googleCalendarStatus: 'synced',
            googleCalendarSyncedAt: new Date(),
            googleCalendarError: null
          }
        }
      );

      return { success: true, action: 'created', eventId: createdEvent.id };
    } catch (err) {
      console.error(`Error syncing subscription ${subscriptionId} for user ${userId}:`, err);
      await Subscription.updateOne(
        { id: subscriptionId, userId },
        { $set: { googleCalendarStatus: 'failed', googleCalendarError: err.message } }
      ).catch(() => {});
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete Google Calendar event corresponding to a deleted or cancelled subscription
   */
  async deleteSubscriptionEvent(userId, subscriptionId, explicitToken = null) {
    try {
      const creds = await getUserCredentials(userId, explicitToken);
      if (!creds || !creds.accessToken) return { skipped: true };

      const { accessToken, calendarId } = creds;
      const sub = await Subscription.findOne({ id: subscriptionId, userId });
      const eventId = sub?.googleCalendarEventId;

      if (eventId) {
        const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
        await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }).catch(() => {});
      }

      // Also clean up any unlinked duplicates with this subscriptionId
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=subtrackSubscriptionId%3D${encodeURIComponent(subscriptionId)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.items)) {
          for (const item of searchData.items) {
            if (item.id !== eventId && item.status !== 'cancelled') {
              fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              }).catch(() => {});
            }
          }
        }
      }

      return { success: true };
    } catch (err) {
      console.warn(`Error deleting calendar event for subscription ${subscriptionId}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete all calendar events belonging to a user (e.g. on clear all)
   */
  async deleteAllSubscriptionEvents(userId, explicitToken = null) {
    try {
      const creds = await getUserCredentials(userId, explicitToken);
      if (!creds || !creds.accessToken) return { skipped: true };

      const { accessToken, calendarId } = creds;
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=subtrackUserId%3D${encodeURIComponent(userId)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.items)) {
          for (const item of searchData.items) {
            if (item.status !== 'cancelled') {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              }).catch(() => {});
            }
          }
        }
      }

      return { success: true };
    } catch (err) {
      console.warn(`Error deleting all calendar events for user ${userId}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sync all active subscriptions for a user (Idempotent)
   */
  async syncAllSubscriptions(userId, explicitToken = null) {
    const creds = await getUserCredentials(userId, explicitToken);
    if (!creds || !creds.accessToken) {
      return { success: false, error: 'Google Calendar not connected' };
    }

    const targetUser = await findUser(userId);
    const userIds = Array.from(new Set([userId, targetUser?.id, targetUser?.googleId].filter(Boolean)));

    const subscriptions = await Subscription.find({
      userId: { $in: userIds },
      status: { $in: ['active', 'trial'] }
    });

    let syncedCount = 0;
    const errors = [];

    for (const sub of subscriptions) {
      const res = await this.syncSubscription(userId, sub.id, creds.accessToken);
      if (res.success) {
        syncedCount += 1;
      } else if (res.error) {
        errors.push({ sub: sub.name, error: res.error });
      }
    }

    // Update user sync status
    if (targetUser) {
      targetUser.googleCalendar = {
        ...targetUser.googleCalendar,
        lastSyncedAt: new Date(),
        syncStatus: errors.length === 0 ? 'synced' : 'error',
        lastError: errors.length > 0 ? errors[0].error : null
      };
      await targetUser.save();
    }

    return {
      success: true,
      total: subscriptions.length,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Full reconciliation:
   * 1. Reconcile all subscriptions with Google Calendar events.
   * 2. Detect & clean up duplicates for each subscription.
   * 3. Clean up orphaned SubTrack events whose subscription was deleted.
   * 4. NEVER delete unrelated user events (only items with subtrackUserId match).
   */
  async reconcileCalendar(userId, explicitToken = null) {
    const creds = await getUserCredentials(userId, explicitToken);
    if (!creds || !creds.accessToken) {
      return { success: false, error: 'Google Calendar not connected' };
    }

    const { accessToken, calendarId } = creds;

    const targetUser = await findUser(userId);
    const userIds = Array.from(new Set([userId, targetUser?.id, targetUser?.googleId].filter(Boolean)));

    // 1. Fetch user's subscriptions
    const subscriptions = await Subscription.find({ userId: { $in: userIds } });
    const subMap = new Map();
    subscriptions.forEach((s) => subMap.set(String(s.id), s));

    // 2. Fetch all Google Calendar events managed for this user
    let gcalEvents = [];
    try {
      const listUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=subtrackUserId%3D${encodeURIComponent(userId)}&maxResults=250`;
      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (listRes.ok) {
        const data = await listRes.json();
        gcalEvents = (data.items || []).filter((item) => item.status !== 'cancelled');
      }
    } catch (e) {
      console.warn('Could not query managed events for reconciliation:', e.message);
    }

    // Group managed events by subtrackSubscriptionId
    const eventsBySubId = new Map();
    const orphanEvents = [];

    for (const event of gcalEvents) {
      const subId = event.extendedProperties?.private?.subtrackSubscriptionId;
      if (!subId || !subMap.has(subId)) {
        orphanEvents.push(event);
      } else {
        if (!eventsBySubId.has(subId)) {
          eventsBySubId.set(subId, []);
        }
        eventsBySubId.get(subId).push(event);
      }
    }

    let duplicatesRemoved = 0;
    let orphansRemoved = 0;
    let reconciledCount = 0;

    // Delete orphans (SubTrack managed events whose subscription is gone)
    for (const orphan of orphanEvents) {
      try {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(orphan.id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        orphansRemoved += 1;
      } catch (e) {}
    }

    // Reconcile subscriptions
    for (const sub of subscriptions) {
      if (sub.status === 'cancelled' || sub.status === 'paused') {
        // If inactive, delete any existing events for this sub
        const existing = eventsBySubId.get(String(sub.id)) || [];
        for (const ev of existing) {
          try {
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(ev.id)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` }
            });
          } catch (e) {}
        }
        await Subscription.updateOne(
          { id: sub.id, userId },
          { $set: { googleCalendarEventId: null, googleCalendarStatus: 'synced' } }
        );
        continue;
      }

      const existing = eventsBySubId.get(String(sub.id)) || [];
      if (existing.length === 0) {
        // No event exists: create it
        await this.syncSubscription(userId, sub.id, accessToken);
        reconciledCount += 1;
      } else {
        // One or more exist: keep primary, delete duplicates
        const primary = existing[0];
        if (existing.length > 1) {
          for (let i = 1; i < existing.length; i++) {
            try {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existing[i].id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              duplicatesRemoved += 1;
            } catch (e) {}
          }
        }

        // Update primary mapping and event
        await Subscription.updateOne(
          { id: sub.id, userId },
          { $set: { googleCalendarEventId: primary.id } }
        );
        await this.syncSubscription(userId, sub.id, accessToken);
        reconciledCount += 1;
      }
    }

    // Update user sync status
    if (targetUser) {
      targetUser.googleCalendar = {
        ...targetUser.googleCalendar,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        lastError: null
      };
      await targetUser.save();
    }

    return {
      success: true,
      reconciledCount,
      duplicatesRemoved,
      orphansRemoved,
      message: `Reconciliation complete: ${reconciledCount} subscriptions synchronized, ${duplicatesRemoved} duplicates removed, ${orphansRemoved} orphaned events cleaned up.`
    };
  },

  /**
   * Get sync status overview for user
   */
  async getSyncStatus(userId) {
    const user = await findUser(userId);
    const isConnected = Boolean(user?.googleCalendar?.connected);
    const syncStatus = user?.googleCalendar?.syncStatus || 'disconnected';
    const lastSyncedAt = user?.googleCalendar?.lastSyncedAt || null;
    const lastError = user?.googleCalendar?.lastError || null;

    const userIds = Array.from(new Set([userId, user?.id, user?.googleId].filter(Boolean)));

    const count = await Subscription.countDocuments({
      userId: { $in: userIds },
      googleCalendarStatus: 'synced',
      status: { $in: ['active', 'trial'] }
    });

    const pendingCount = await Subscription.countDocuments({
      userId: { $in: userIds },
      googleCalendarStatus: 'pending',
      status: { $in: ['active', 'trial'] }
    });

    const failedCount = await Subscription.countDocuments({
      userId: { $in: userIds },
      googleCalendarStatus: 'failed',
      status: { $in: ['active', 'trial'] }
    });

    return {
      connected: isConnected,
      syncStatus,
      lastSyncedAt,
      lastError,
      syncedSubscriptionsCount: count,
      pendingCount,
      failedCount
    };
  }
};

export default calendarSyncService;
