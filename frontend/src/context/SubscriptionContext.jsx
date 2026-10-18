import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Scoped subscription state strictly per user
  const [subscriptions, setSubscriptions] = useState(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(`subtrack_subscriptions_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved) || [];
      } catch (e) {
        console.error('Error parsing user subscriptions from localStorage', e);
      }
    }
    return [];
  });

  const [snoozedAlerts, setSnoozedAlerts] = useState(() => {
    if (!userId) return {};
    const saved = localStorage.getItem(`subtrack_snoozed_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved) || {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const [dbConnected, setDbConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  // Google Calendar Connection & Sync Status
  const [calendarStatus, setCalendarStatus] = useState(() => {
    if (!userId) return { connected: false, syncStatus: 'disconnected' };
    const saved = localStorage.getItem(`subtrack_cal_status_${userId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { connected: false, syncStatus: 'disconnected' };
  });

  const refreshCalendarStatus = async () => {
    if (!userId) return;
    try {
      const status = await api.getCalendarStatus(userId);
      if (status) {
        setCalendarStatus(status);
        localStorage.setItem(`subtrack_cal_status_${userId}`, JSON.stringify(status));
      }
    } catch (e) {
      console.warn('Could not refresh calendar status:', e.message);
    }
  };

  // When user logs in, switches accounts, or logs out: re-sync user's isolated data
  useEffect(() => {
    if (!userId) {
      setSubscriptions([]);
      setSnoozedAlerts({});
      return;
    }

    // Load user's cached subscriptions first
    const cached = localStorage.getItem(`subtrack_subscriptions_${userId}`);
    if (cached) {
      try {
        setSubscriptions(JSON.parse(cached));
      } catch (e) {}
    } else {
      setSubscriptions([]);
    }

    const cachedSnooze = localStorage.getItem(`subtrack_snoozed_${userId}`);
    if (cachedSnooze) {
      try {
        setSnoozedAlerts(JSON.parse(cachedSnooze));
      } catch (e) {}
    } else {
      setSnoozedAlerts({});
    }

    let isMounted = true;
    const fetchUserData = async () => {
      try {
        const health = await api.getHealth();
        if (isMounted) {
          setDbConnected(Boolean(health?.mongodb?.connected));
          setDbStatus(health?.mongodb || null);
        }

        // Fetch strictly for this user
        const mongoSubs = await api.getSubscriptions(userId);
        if (Array.isArray(mongoSubs) && isMounted) {
          setSubscriptions(mongoSubs);
          localStorage.setItem(`subtrack_subscriptions_${userId}`, JSON.stringify(mongoSubs));
        }

        // Fetch Google Calendar status
        if (isMounted) {
          refreshCalendarStatus();
        }
      } catch (err) {
        console.info('Backend/MongoDB sync notice for user:', err.message);
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, [userId]);

  // Sync to user-specific localStorage cache
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`subtrack_subscriptions_${userId}`, JSON.stringify(subscriptions));
    }
  }, [subscriptions, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`subtrack_snoozed_${userId}`, JSON.stringify(snoozedAlerts));
    }
  }, [snoozedAlerts, userId]);

  // Add new subscription (strictly tagged with current user ID)
  const addSubscription = (newSub) => {
    if (!userId) {
      console.warn('Cannot add subscription without active user');
      return null;
    }

    const item = {
      ...newSub,
      id: newSub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: userId,
      status: newSub.isFreeTrial ? 'trial' : (newSub.status || 'active'),
      createdAt: new Date().toISOString()
    };

    setSubscriptions(prev => [item, ...prev]);

    // Persist to MongoDB backend with userId
    api.createSubscription(item).catch(err => {
      console.warn('Could not persist subscription to MongoDB backend:', err.message);
    });

    // Small celebratory confetti trigger
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}

    return item;
  };

  // Update existing subscription for this user
  const updateSubscription = (id, updatedFields) => {
    if (!userId) return;

    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, ...updatedFields } : sub))
    );

    api.updateSubscription(id, updatedFields, userId).catch(err => {
      console.warn('Could not update subscription in MongoDB backend:', err.message);
    });
  };

  // Delete subscription for this user
  const deleteSubscription = (id) => {
    if (!userId) return;

    setSubscriptions(prev => prev.filter(sub => sub.id !== id));

    api.deleteSubscription(id, userId).catch(err => {
      console.warn('Could not delete subscription from MongoDB backend:', err.message);
    });
  };

  // Renew subscription: advance renewal date based on cycle
  const renewSubscription = (id) => {
    if (!userId) return;
    let updatedItem = null;

    setSubscriptions(prev =>
      prev.map(sub => {
        if (sub.id !== id) return sub;

        const currentRenewal = new Date(sub.nextRenewalDate || new Date());
        let nextDate = new Date(currentRenewal);

        if (sub.billingCycle === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else if (sub.billingCycle === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (sub.billingCycle === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        updatedItem = {
          ...sub,
          isFreeTrial: false,
          status: 'active',
          lastRenewedDate: new Date().toISOString().split('T')[0],
          nextRenewalDate: nextDate.toISOString().split('T')[0]
        };

        return updatedItem;
      })
    );

    if (updatedItem) {
      api.updateSubscription(id, updatedItem, userId).catch(err => {
        console.warn('Could not sync renewal to MongoDB backend:', err.message);
      });
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  };

  // Cancel subscription
  const cancelSubscription = (id) => {
    if (!userId) return;

    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, status: 'cancelled' } : sub))
    );

    api.updateSubscription(id, { status: 'cancelled' }, userId).catch(err => {
      console.warn('Could not cancel in MongoDB backend:', err.message);
    });
  };

  // Pause or toggle active status
  const togglePauseSubscription = (id) => {
    if (!userId) return;
    let newStatus = 'active';

    setSubscriptions(prev =>
      prev.map(sub => {
        if (sub.id !== id) return sub;
        newStatus = sub.status === 'paused' ? 'active' : 'paused';
        return {
          ...sub,
          status: newStatus
        };
      })
    );

    api.updateSubscription(id, { status: newStatus }, userId).catch(err => {
      console.warn('Could not update pause status in MongoDB backend:', err.message);
    });
  };

  // Snooze alert
  const snoozeAlert = (id, days = 3) => {
    const untildate = new Date();
    untildate.setDate(untildate.getDate() + days);
    setSnoozedAlerts(prev => ({
      ...prev,
      [id]: untildate.toISOString().split('T')[0]
    }));
  };

  // Clear all subscriptions for current user only
  const clearAllSubscriptions = () => {
    if (!userId) return;

    setSubscriptions([]);
    localStorage.removeItem(`subtrack_subscriptions_${userId}`);
    localStorage.removeItem(`subtrack_snoozed_${userId}`);

    api.clearAllSubscriptions(userId).catch(err => {
      console.warn('Could not clear user subscriptions from MongoDB:', err.message);
    });
  };

  // Import JSON strictly for this user
  const importSubscriptions = (jsonData) => {
    if (!userId) return { success: false, error: 'User must be logged in to import data' };

    try {
      const rawList = Array.isArray(jsonData) ? jsonData : jsonData.subscriptions;
      if (Array.isArray(rawList) && rawList.length > 0) {
        const userList = rawList.map(s => ({
          ...s,
          id: s.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: userId
        }));

        setSubscriptions(userList);
        api.bulkImportSubscriptions(userList, userId).catch(err => {
          console.warn('Could not bulk import to MongoDB backend:', err.message);
        });
        return { success: true, count: userList.length };
      }
      return { success: false, error: 'Invalid file format or empty list' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // =========================================================================
  // COMPUTED METRICS & ANALYTICS
  // =========================================================================

  const getMonthlyEquivalent = (sub) => {
    if (sub.status === 'cancelled' || sub.status === 'paused') return 0;
    const cost = Number(sub.cost) || 0;
    if (sub.billingCycle === 'yearly') return cost / 12;
    if (sub.billingCycle === 'quarterly') return cost / 3;
    if (sub.billingCycle === 'weekly') return cost * 4.33;
    return cost;
  };

  const { monthlySpend, yearlySpend, activeCount, trialCount } = useMemo(() => {
    let monthly = 0;
    let active = 0;
    let trials = 0;

    subscriptions.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trial') {
        monthly += getMonthlyEquivalent(sub);
        active += 1;
      }
      if (sub.isFreeTrial || sub.status === 'trial') {
        trials += 1;
      }
    });

    return {
      monthlySpend: monthly,
      yearlySpend: monthly * 12,
      activeCount: active,
      trialCount: trials
    };
  }, [subscriptions]);

  const urgentAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter(sub => {
      if (sub.status === 'cancelled' || sub.status === 'paused') return false;

      if (snoozedAlerts[sub.id]) {
        const snoozeDate = new Date(snoozedAlerts[sub.id]);
        if (snoozeDate >= today) return false;
      }

      const renewal = new Date(sub.nextRenewalDate || sub.trialEndDate);
      renewal.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= (sub.reminderDays || 3);
    }).map(sub => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const renewal = new Date(sub.nextRenewalDate || sub.trialEndDate);
      renewal.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
      return {
        ...sub,
        daysLeft
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions, snoozedAlerts]);

  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions
      .filter(sub => sub.status !== 'cancelled' && sub.status !== 'paused' && sub.nextRenewalDate)
      .map(sub => {
        const renewal = new Date(sub.nextRenewalDate);
        renewal.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
        return { ...sub, daysLeft };
      })
      .filter(sub => sub.daysLeft >= 0 && sub.daysLeft <= 14)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [subscriptions]);

  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    let total = 0;

    subscriptions.forEach(sub => {
      if (sub.status === 'cancelled' || sub.status === 'paused') return;
      const cat = sub.category || 'Other';
      const mCost = getMonthlyEquivalent(sub);
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, totalCost: 0, count: 0 };
      }
      catMap[cat].totalCost += mCost;
      catMap[cat].count += 1;
      total += mCost;
    });

    return Object.values(catMap).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.totalCost / total) * 100) : 0
    })).sort((a, b) => b.totalCost - a.totalCost);
  }, [subscriptions]);

  const paymentMethodBreakdown = useMemo(() => {
    const payMap = {};
    let total = 0;

    subscriptions.forEach(sub => {
      if (sub.status === 'cancelled' || sub.status === 'paused') return;
      const method = sub.paymentMethod || 'Other';
      const mCost = getMonthlyEquivalent(sub);
      if (!payMap[method]) {
        payMap[method] = { method, totalCost: 0, count: 0 };
      }
      payMap[method].totalCost += mCost;
      payMap[method].count += 1;
      total += mCost;
    });

    return Object.values(payMap).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.totalCost / total) * 100) : 0
    })).sort((a, b) => b.totalCost - a.totalCost);
  }, [subscriptions]);

  const nextBillDue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeList = subscriptions
      .filter(s => s.status !== 'cancelled' && s.status !== 'paused' && (s.nextRenewalDate || s.trialEndDate))
      .map(s => {
        const renewal = new Date(s.isFreeTrial && s.trialEndDate ? s.trialEndDate : s.nextRenewalDate);
        renewal.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
        return { ...s, daysLeft, targetDate: renewal };
      })
      .filter(s => s.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return activeList.length > 0 ? activeList[0] : null;
  }, [subscriptions]);

  const tagUsageFrequency = (id, usageFrequency) => {
    updateSubscription(id, { usageFrequency });
  };

  // Google Calendar Integration Actions
  const connectCalendar = async (credentials) => {
    if (!userId) return { success: false, error: 'User must be logged in' };
    const res = await api.connectGoogleCalendar(userId, credentials);
    await refreshCalendarStatus();
    return res;
  };

  const disconnectCalendar = async () => {
    if (!userId) return;
    const res = await api.disconnectGoogleCalendar(userId);
    await refreshCalendarStatus();
    return res;
  };

  const reconcileCalendar = async (accessToken = null) => {
    if (!userId) return;
    const res = await api.reconcileGoogleCalendar(userId, accessToken);
    await refreshCalendarStatus();
    return res;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        renewSubscription,
        cancelSubscription,
        togglePauseSubscription,
        snoozeAlert,
        clearAllSubscriptions,
        importSubscriptions,
        getMonthlyEquivalent,
        monthlySpend,
        yearlySpend,
        activeCount,
        trialCount,
        urgentAlerts,
        upcomingRenewals,
        categoryBreakdown,
        paymentMethodBreakdown,
        nextBillDue,
        tagUsageFrequency,
        dbConnected,
        dbStatus,
        calendarStatus,
        refreshCalendarStatus,
        connectCalendar,
        disconnectCalendar,
        reconcileCalendar
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}
