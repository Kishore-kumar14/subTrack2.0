/**
 * SubTrack Backend API Service
 * Handles MongoDB operations via Express backend endpoints (/api/...)
 */

// Cloud or local API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? 'https://backend-x1jq.onrender.com/api'
    : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('subtrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  /**
   * Health & MongoDB connection check
   */
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return await res.json();
    } catch (e) {
      return {
        status: 'offline',
        mongodb: {
          connected: false,
          status: 'Offline / Unreachable',
          error: e.message
        }
      };
    }
  },

  /**
   * Central Subscription Catalog (MongoDB Atlas)
   */
  async getCatalog({ search = '', category = 'All', activeOnly = true } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/catalog${queryStr}`);
      if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn('Backend catalog API unreachable, using fallback:', e.message);
      return null;
    }
  },

  async getCatalogProvider(providerId) {
    if (!providerId) return null;
    try {
      const res = await fetch(`${API_BASE}/catalog/${encodeURIComponent(providerId)}`);
      if (!res.ok) throw new Error(`Provider not found: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn('Backend catalog provider fetch error:', e.message);
      return null;
    }
  },

  /**
   * Subscriptions CRUD (Strictly isolated by authenticated identity)
   */
  async getSubscriptions(userId) {
    if (!userId) return [];
    const res = await fetch(`${API_BASE}/subscriptions?userId=${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch subscriptions: ${res.statusText}`);
    return await res.json();
  },

  async createSubscription(subData) {
    if (!subData.userId) {
      throw new Error('User ID is required to create a subscription');
    }
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subData)
    });
    if (!res.ok) throw new Error(`Failed to create subscription: ${res.statusText}`);
    return await res.json();
  },

  async updateSubscription(id, subData, userId) {
    const payload = { ...subData, userId };
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to update subscription: ${res.statusText}`);
    return await res.json();
  },

  async deleteSubscription(id, userId) {
    const url = userId
      ? `${API_BASE}/subscriptions/${id}?userId=${encodeURIComponent(userId)}`
      : `${API_BASE}/subscriptions/${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to delete subscription: ${res.statusText}`);
    return await res.json();
  },

  async clearAllSubscriptions(userId) {
    if (!userId) throw new Error('User ID is required to clear subscriptions');
    const res = await fetch(`${API_BASE}/subscriptions?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to clear subscriptions: ${res.statusText}`);
    return await res.json();
  },

  async bulkImportSubscriptions(subscriptions, userId) {
    if (!userId) throw new Error('User ID is required for bulk import');
    const res = await fetch(`${API_BASE}/subscriptions/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subscriptions, userId })
    });
    if (!res.ok) throw new Error(`Failed to bulk import subscriptions: ${res.statusText}`);
    return await res.json();
  },

  /**
   * User & Auth operations
   */
  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Registration failed');
    }
    return await res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }
    return await res.json();
  },

  async googleLogin(token, directProfile = null) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, directProfile })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Google authentication failed');
    }
    return await res.json();
  },

  async resendConfirmationEmail(email) {
    const res = await fetch(`${API_BASE}/auth/resend-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to resend confirmation email');
    }
    return await res.json();
  },

  async updateUser(id, updateData) {
    const res = await fetch(`${API_BASE}/auth/user/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return await res.json();
  },

  /**
   * Calendar & Google Calendar integration
   */
  async connectGoogleCalendar(userId, { accessToken, refreshToken, expiresIn }) {
    const res = await fetch(`${API_BASE}/calendar/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, accessToken, refreshToken, expiresIn })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to connect Google Calendar');
    }
    return await res.json();
  },

  async disconnectGoogleCalendar(userId) {
    const res = await fetch(`${API_BASE}/calendar/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to disconnect Google Calendar');
    }
    return await res.json();
  },

  async getCalendarStatus(userId) {
    if (!userId) return { connected: false, syncStatus: 'disconnected' };
    const res = await fetch(`${API_BASE}/calendar/status?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      return { connected: false, syncStatus: 'disconnected' };
    }
    return await res.json();
  },

  async reconcileGoogleCalendar(userId, accessToken) {
    const res = await fetch(`${API_BASE}/calendar/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, accessToken })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to reconcile calendar');
    }
    return await res.json();
  },

  async directSyncToGoogleCalendar(accessToken, subscriptions, userId) {
    const res = await fetch(`${API_BASE}/calendar/direct-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, subscriptions, userId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to sync with Google Calendar API');
    }
    return await res.json();
  },

  getCalendarFeedUrl(userId) {
    if (!userId) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
      : (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? 'https://backend-x1jq.onrender.com'
        : window.location.origin;
    return `${baseUrl}/api/calendar/${userId}/feed.ics`;
  },

  /**
   * Generates a Google Calendar web template URL for an individual renewal reminder
   */
  generateGoogleCalendarUrl(sub) {
    if (!sub) return '';
    const date = sub.nextRenewalDate || sub.firstBillingDate;
    if (!date) return '';

    const cleanDate = date.replace(/-/g, '').slice(0, 8);
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const endDate = `${year}${month}${day}`;

    const title = encodeURIComponent(`🔔 Renewal: ${sub.name} (₹${sub.cost})`);
    const details = encodeURIComponent(
      `SubTrack Renewal Alert\n\n` +
      `Service: ${sub.name}\n` +
      `Plan: ${sub.planName || 'Standard'}\n` +
      `Amount: ₹${sub.cost}\n` +
      `Cycle: ${sub.billingCycle || 'monthly'}\n` +
      `Payment Method: ${sub.paymentMethod || 'Credit Card'}\n` +
      `Category: ${sub.category || 'Other'}\n` +
      (sub.notes ? `Notes: ${sub.notes}\n` : '') +
      `\nManaged in SubTrack: ${window.location.origin}`
    );

    let recur = '';
    if (sub.billingCycle === 'monthly') recur = '&recur=RRULE:FREQ=MONTHLY';
    else if (sub.billingCycle === 'yearly') recur = '&recur=RRULE:FREQ=YEARLY';
    else if (sub.billingCycle === 'quarterly') recur = '&recur=RRULE:FREQ=MONTHLY;INTERVAL=3';
    else if (sub.billingCycle === 'weekly') recur = '&recur=RRULE:FREQ=WEEKLY';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}/${endDate}&details=${details}${recur}`;
  }
};
