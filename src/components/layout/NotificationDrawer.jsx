import React from 'react';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, X, AlertTriangle, CheckCircle2, Clock, Ban, RefreshCw, Sparkles } from 'lucide-react';
import SubscriptionIcon from '../common/SubscriptionIcon';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { urgentAlerts, renewSubscription, cancelSubscription, snoozeAlert } = useSubscriptions();
  const { formatAmount } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Action Center</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {urgentAlerts.length} urgent notification{urgentAlerts.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts List */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {urgentAlerts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)'
              }}
            >
              <CheckCircle2 size={48} style={{ color: 'var(--accent-emerald)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                All clear! No renewals due soon
              </h4>
              <p style={{ fontSize: '0.825rem' }}>
                You're all caught up. No subscriptions require action in the next 3 days.
              </p>
            </div>
          ) : (
            urgentAlerts.map(alert => (
              <div
                key={alert.id}
                className="glass-panel"
                style={{
                  padding: '1.1rem',
                  borderLeft: alert.isFreeTrial ? '4px solid var(--accent-amber)' : '4px solid var(--accent-rose)',
                  background: 'var(--bg-card)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <SubscriptionIcon subscription={alert} size={32} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{alert.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {formatAmount(alert.cost)} / {alert.billingCycle}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`badge ${alert.isFreeTrial ? 'badge-amber' : 'badge-rose'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {alert.daysLeft === 0 ? 'Due Today' : alert.daysLeft === 1 ? 'Tomorrow' : `In ${alert.daysLeft} days`}
                  </span>
                </div>

                {/* Alert Message */}
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  {alert.isFreeTrial ? (
                    <span>
                      ⚠️ <strong>Free trial expiration alert!</strong> Cancel now to prevent an automatic charge of {formatAmount(alert.cost)}.
                    </span>
                  ) : (
                    <span>
                      Scheduled renewal via <strong>{alert.paymentMethod}</strong>.
                    </span>
                  )}
                </p>

                {/* Quick Action Center Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => renewSubscription(alert.id)}
                    className="btn btn-sm btn-success"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={13} />
                    <span>Mark Renewed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelSubscription(alert.id)}
                    className="btn btn-sm btn-danger"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  >
                    <Ban size={13} />
                    <span>Cancel Sub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => snoozeAlert(alert.id, 3)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.75rem' }}
                    title="Snooze reminder for 3 days"
                  >
                    <Clock size={13} />
                    <span>Snooze</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            fontSize: '0.775rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>SubTrack Alert Engine</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Active</span>
        </div>
      </div>
    </div>
  );
}
