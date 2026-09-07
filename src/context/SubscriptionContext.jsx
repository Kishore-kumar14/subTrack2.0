import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { INITIAL_SUBSCRIPTIONS } from '../data/seedData';
import confetti from 'canvas-confetti';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('subtrack_subscriptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved subscriptions', e);
      }
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  const [snoozedAlerts, setSnoozedAlerts] = useState(() => {
    const saved = localStorage.getItem('subtrack_snoozed');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('subtrack_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('subtrack_snoozed', JSON.stringify(snoozedAlerts));
  }, [snoozedAlerts]);

  // Add new subscription
  const addSubscription = (newSub) => {
    const item = {
      ...newSub,
      id: newSub.id || `sub-${Date.now()}`,
      status: newSub.isFreeTrial ? 'trial' : 'active',
      createdAt: new Date().toISOString()
    };
    setSubscriptions(prev => [item, ...prev]);

    // Small celebratory confetti trigger for adding a subscription
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}

    return item;
  };

  // Update existing subscription
  const updateSubscription = (id, updatedFields) => {
    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, ...updatedFields } : sub))
    );
  };

  // Delete subscription
  const deleteSubscription = (id) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  // Renew subscription: advance renewal date based on cycle
  const renewSubscription = (id) => {
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
          // Default monthly
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        return {
          ...sub,
          isFreeTrial: false,
          status: 'active',
          lastRenewedDate: new Date().toISOString().split('T')[0],
          nextRenewalDate: nextDate.toISOString().split('T')[0]
        };
      })
    );

    // Confetti celebration
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
    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, status: 'cancelled' } : sub))
    );
  };

  // Pause or toggle active status
  const togglePauseSubscription = (id) => {
    setSubscriptions(prev =>
      prev.map(sub => {
        if (sub.id !== id) return sub;
        return {
          ...sub,
          status: sub.status === 'paused' ? 'active' : 'paused'
        };
      })
    );
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

  // Reset to default seed data
  const resetToDemoData = () => {
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setSnoozedAlerts({});
    localStorage.removeItem('subtrack_subscriptions');
    localStorage.removeItem('subtrack_snoozed');
  };

  // Clear all
  const clearAllSubscriptions = () => {
    setSubscriptions([]);
  };

  // Import JSON
  const importSubscriptions = (jsonData) => {
    try {
      const parsed = Array.isArray(jsonData) ? jsonData : jsonData.subscriptions;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSubscriptions(parsed);
        return { success: true, count: parsed.length };
      }
      return { success: false, error: 'Invalid file format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // =========================================================================
  // COMPUTED METRICS & ANALYTICS
  // =========================================================================

  // Helper to normalize any cost into monthly amount
  const getMonthlyEquivalent = (sub) => {
    if (sub.status === 'cancelled' || sub.status === 'paused') return 0;
    const cost = Number(sub.cost) || 0;
    if (sub.billingCycle === 'yearly') return cost / 12;
    if (sub.billingCycle === 'quarterly') return cost / 3;
    if (sub.billingCycle === 'weekly') return cost * 4.33;
    return cost;
  };

  // Monthly and Annual Totals
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

  // Urgent Alerts (Renews or Trial expires within <= 3 days)
  const urgentAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter(sub => {
      if (sub.status === 'cancelled' || sub.status === 'paused') return false;

      // Check if snoozed
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

  // Upcoming renewals in next 14 days
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

  // Category Breakdown
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

  // Payment Method Breakdown
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

  // Next Bill Due (very next charge)
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

  // Tag usage frequency on any subscription
  const tagUsageFrequency = (id, usageFrequency) => {
    updateSubscription(id, { usageFrequency });
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
        resetToDemoData,
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
        tagUsageFrequency
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

