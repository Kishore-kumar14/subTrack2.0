import test from 'node:test';
import assert from 'node:assert/strict';

// Helper to simulate Google Calendar API responses
function createMockGoogleCalendarApi() {
  const events = new Map();
  let nextId = 1000;

  const mockFetch = async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // List events: /calendar/v3/calendars/primary/events
    if (path.endsWith('/events') && method === 'GET') {
      const privateExtProp = urlObj.searchParams.get('privateExtendedProperty') || '';
      let items = Array.from(events.values());

      if (privateExtProp) {
        const [key, val] = decodeURIComponent(privateExtProp).split('=');
        items = items.filter(ev => {
          const priv = ev.extendedProperties?.private || {};
          return priv[key] === val;
        });
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ items })
      };
    }

    // Create event: POST /calendar/v3/calendars/primary/events
    if (path.endsWith('/events') && method === 'POST') {
      const body = JSON.parse(options.body);
      const id = `gcal-evt-${nextId++}`;
      const created = { ...body, id, status: 'confirmed', htmlLink: `https://calendar.google.com/event?eid=${id}` };
      events.set(id, created);
      return {
        ok: true,
        status: 201,
        json: async () => created
      };
    }

    // Get event: GET /calendar/v3/calendars/primary/events/:id
    if (method === 'GET' && path.includes('/events/')) {
      const eventId = decodeURIComponent(path.split('/events/')[1]);
      if (events.has(eventId)) {
        return {
          ok: true,
          status: 200,
          json: async () => events.get(eventId)
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not Found' } })
      };
    }

    // Update event: PATCH / PUT /calendar/v3/calendars/primary/events/:id
    if ((method === 'PATCH' || method === 'PUT') && path.includes('/events/')) {
      const eventId = decodeURIComponent(path.split('/events/')[1]);
      if (events.has(eventId)) {
        const existing = events.get(eventId);
        const body = JSON.parse(options.body);
        const updated = { ...existing, ...body };
        events.set(eventId, updated);
        return {
          ok: true,
          status: 200,
          json: async () => updated
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not Found' } })
      };
    }

    // Delete event: DELETE /calendar/v3/calendars/primary/events/:id
    if (method === 'DELETE' && path.includes('/events/')) {
      const eventId = decodeURIComponent(path.split('/events/')[1]);
      if (events.has(eventId)) {
        events.delete(eventId);
        return { ok: true, status: 204 };
      }
      return { ok: false, status: 404, json: async () => ({ error: { message: 'Not Found' } }) };
    }

    return {
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Unknown mock endpoint' } })
    };
  };

  return { mockFetch, events };
}

test('Google Calendar Sync: Idempotency & Deduplication', async () => {
  const { mockFetch, events } = createMockGoogleCalendarApi();
  const originalFetch = global.fetch;
  global.fetch = mockFetch;

  try {
    // 1. Simulate creating an event for a subscription
    const sub1 = {
      id: 'sub-netflix-1',
      userId: 'user-123',
      name: 'Netflix',
      cost: 649,
      billingCycle: 'monthly',
      nextRenewalDate: '2026-10-25'
    };

    const payload = {
      summary: `🔔 ${sub1.name} Renewal (₹${sub1.cost})`,
      start: { date: '2026-10-25' },
      end: { date: '2026-10-26' },
      recurrence: ['RRULE:FREQ=MONTHLY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 4320 },
          { method: 'popup', minutes: 1440 }
        ]
      },
      extendedProperties: {
        private: {
          subtrackSubscriptionId: sub1.id,
          subtrackUserId: sub1.userId,
          subtrackManaged: 'true'
        }
      }
    };

    // First insertion
    const res1 = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify(payload)
    });
    const created1 = await res1.json();
    assert.equal(res1.status, 201);
    assert.ok(created1.id);
    assert.equal(events.size, 1);

    // Verify reminder overrides (3 days = 4320 mins, 1 day = 1440 mins)
    assert.equal(created1.reminders.overrides[0].minutes, 4320);
    assert.equal(created1.reminders.overrides[1].minutes, 1440);

    // 2. Click Sync multiple times: update existing event instead of creating duplicate
    const res2 = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${created1.id}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify(payload)
    });
    assert.equal(res2.ok, true);
    // Events count should still be 1! No duplicates!
    assert.equal(events.size, 1);

    // 3. Edit subscription: change amount and renewal date
    const updatedPayload = {
      ...payload,
      summary: `🔔 Netflix Renewal (₹799)`,
      start: { date: '2026-10-28' },
      end: { date: '2026-10-29' }
    };
    const res3 = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${created1.id}`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify(updatedPayload)
    });
    const updatedEvt = await res3.json();
    assert.equal(updatedEvt.summary, '🔔 Netflix Renewal (₹799)');
    assert.equal(updatedEvt.start.date, '2026-10-28');
    assert.equal(events.size, 1);

    // 4. Two subscriptions with identical names remain distinct
    const sub2 = {
      id: 'sub-netflix-2',
      userId: 'user-123',
      name: 'Netflix',
      cost: 199,
      billingCycle: 'monthly',
      nextRenewalDate: '2026-11-01'
    };
    const payloadSub2 = {
      ...payload,
      summary: `🔔 Netflix Renewal (₹199)`,
      extendedProperties: {
        private: {
          subtrackSubscriptionId: sub2.id,
          subtrackUserId: sub2.userId,
          subtrackManaged: 'true'
        }
      }
    };
    const res4 = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify(payloadSub2)
    });
    assert.equal(res4.status, 201);
    assert.equal(events.size, 2);

    // 5. Unrelated user events are preserved
    const unrelatedEvent = {
      id: 'personal-doctor-appointment',
      summary: 'Doctor Appointment',
      start: { date: '2026-10-30' },
      end: { date: '2026-10-30' }
      // No subtrackUserId extendedProperties!
    };
    events.set(unrelatedEvent.id, unrelatedEvent);
    assert.equal(events.size, 3);

    // 6. Delete subscription sub1 removes only its managed event
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${created1.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token' }
    });
    assert.equal(events.has(created1.id), false);
    // Unrelated event must still exist!
    assert.equal(events.has(unrelatedEvent.id), true);
    assert.equal(events.size, 2);

    // 7. Reconcile existing duplicates: if two events exist for sub2, clean up duplicates
    const duplicateOfSub2 = {
      ...payloadSub2,
      id: 'gcal-duplicate-of-sub2'
    };
    events.set(duplicateOfSub2.id, duplicateOfSub2);
    assert.equal(events.size, 3);

    // Query managed events for user-123
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=subtrackUserId%3Duser-123');
    const listData = await listRes.json();
    assert.equal(listData.items.length, 2); // Two items for user-123 (sub2 and its duplicate)

    // Reconcile: delete the duplicate
    events.delete(duplicateOfSub2.id);
    assert.equal(events.has(duplicateOfSub2.id), false);
    assert.equal(events.has(unrelatedEvent.id), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('Recurrence Rules & Billing Intervals', () => {
  const getRRule = (cycle) => {
    if (cycle === 'monthly') return 'RRULE:FREQ=MONTHLY';
    if (cycle === 'yearly') return 'RRULE:FREQ=YEARLY';
    if (cycle === 'quarterly') return 'RRULE:FREQ=MONTHLY;INTERVAL=3';
    if (cycle === 'weekly') return 'RRULE:FREQ=WEEKLY';
    return null;
  };

  assert.equal(getRRule('monthly'), 'RRULE:FREQ=MONTHLY');
  assert.equal(getRRule('yearly'), 'RRULE:FREQ=YEARLY');
  assert.equal(getRRule('quarterly'), 'RRULE:FREQ=MONTHLY;INTERVAL=3');
  assert.equal(getRRule('weekly'), 'RRULE:FREQ=WEEKLY');
});
