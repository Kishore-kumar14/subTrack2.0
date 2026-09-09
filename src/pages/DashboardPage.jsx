import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import StatCard from '../components/common/StatCard';
import SubscriptionIcon from '../components/common/SubscriptionIcon';
import {
  Wallet,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Ban
} from 'lucide-react';

export default function DashboardPage({ onNavigate, onOpenAddModal, onEditSubscription }) {
  const { user, formatAmount } = useAuth();
  const {
    subscriptions,
    monthlySpend,
    yearlySpend,
    activeCount,
    trialCount,
    urgentAlerts,
    upcomingRenewals,
    categoryBreakdown,
    renewSubscription,
    cancelSubscription,
    snoozeAlert
  } = useSubscriptions();

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Member'}! 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Here is your subscription financial overview and upcoming billing schedule.
          </p>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <StatCard
          title="Total Monthly Spend"
          value={formatAmount(monthlySpend)}
          subtitle="Normalized recurring outflow"
          badgeText="Active Pace"
          badgeType="primary"
          icon={Wallet}
          accentColor="var(--primary)"
        />

        <StatCard
          title="Projected Annual Spend"
          value={formatAmount(yearlySpend)}
          subtitle="Estimated 12-month commitment"
          badgeText="Annualized"
          badgeType="emerald"
          icon={TrendingUp}
          accentColor="var(--accent-emerald)"
        />

        <StatCard
          title="Active Subscriptions"
          value={activeCount}
          subtitle={`${subscriptions.length - activeCount} paused / inactive`}
          badgeText="Total Services"
          badgeType="cyan"
          icon={Layers}
          accentColor="var(--accent-cyan)"
        />

        <StatCard
          title="Free Trials & Urgent Alerts"
          value={urgentAlerts.length}
          subtitle={`${trialCount} active free trials`}
          badgeText={urgentAlerts.length > 0 ? 'Action Needed' : 'All Clear'}
          badgeType={urgentAlerts.length > 0 ? 'rose' : 'emerald'}
          icon={ShieldAlert}
          accentColor={urgentAlerts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}
        />
      </div>

      {/* Action Center Banner (When trials expire or renewals are due soon) */}
      {urgentAlerts.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: 'var(--accent-rose)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Action Center — {urgentAlerts.length} Renewal{urgentAlerts.length === 1 ? '' : 's'} Due Soon
                </h3>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Take immediate action to retain, cancel, or mark subscriptions as renewed.
                </div>
              </div>
            </div>

            <span className="badge badge-rose" style={{ animation: 'pulseGlow 2s infinite' }}>
              Urgent Attention
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}
          >
            {urgentAlerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: alert.isFreeTrial ? '1.5px solid var(--accent-amber)' : '1.5px solid rgba(244, 63, 94, 0.35)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <SubscriptionIcon subscription={alert} size={28} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{alert.name}</span>
                    </div>

                    <span style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {formatAmount(alert.cost)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0.4rem 0 0.85rem 0' }}>
                    {alert.isFreeTrial ? (
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                        ⚠️ Free trial ends in {alert.daysLeft === 0 ? 'hours' : `${alert.daysLeft} days`}. Cancel to avoid charge!
                      </span>
                    ) : (
                      <span>
                        Automatic renewal scheduled in {alert.daysLeft === 0 ? 'today' : `${alert.daysLeft} days`} via {alert.paymentMethod}.
                      </span>
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => renewSubscription(alert.id)}
                    className="btn btn-sm btn-success"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={12} />
                    <span>Renewed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelSubscription(alert.id)}
                    className="btn btn-sm btn-danger"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    <Ban size={12} />
                    <span>Cancel Sub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => snoozeAlert(alert.id, 3)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.75rem' }}
                    title="Snooze reminder for 3 days"
                  >
                    <Clock size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Section: Upcoming Timeline & Category Spend Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Upcoming Renewals Timeline (Next 14 Days) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--primary-light)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Upcoming Renewals</h3>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="btn-ghost"
              style={{ fontSize: '0.775rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>View Calendar</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingRenewals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No renewals scheduled in the next 14 days.
              </div>
            ) : (
              upcomingRenewals.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-badge)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <SubscriptionIcon subscription={item} size={32} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Due {item.daysLeft === 0 ? 'today' : item.daysLeft === 1 ? 'tomorrow' : `in ${item.daysLeft} days`}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {formatAmount(item.cost)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {item.paymentMethod}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Category Distribution Preview */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Category Spending</h3>
            <button
              onClick={() => onNavigate('analytics')}
              className="btn-ghost"
              style={{ fontSize: '0.775rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <span>Full Analytics</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryBreakdown.slice(0, 5).map(cat => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category} ({cat.count})</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatAmount(cat.totalCost)} <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({cat.percentage}%)</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: '7px',
                    width: '100%',
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      background: 'var(--gradient-primary)',
                      borderRadius: 'var(--radius-full)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
