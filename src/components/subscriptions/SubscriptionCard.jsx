import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { CategoryBadge, StatusBadge } from '../common/Badge';
import { Calendar, CreditCard, RefreshCw, MoreVertical, Edit2, Trash2, PauseCircle, PlayCircle, Clock } from 'lucide-react';

export default function SubscriptionCard({ subscription, onEdit }) {
  const { formatAmount } = useAuth();
  const { renewSubscription, deleteSubscription, togglePauseSubscription } = useSubscriptions();

  // Calculate days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(subscription.isFreeTrial && subscription.trialEndDate ? subscription.trialEndDate : subscription.nextRenewalDate);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isUrgent = daysLeft <= 3 && daysLeft >= 0 && subscription.status !== 'cancelled' && subscription.status !== 'paused';
  const isOverdue = daysLeft < 0 && subscription.status !== 'cancelled' && subscription.status !== 'paused';

  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: `4px solid ${subscription.brandColor || 'var(--primary)'}`,
        position: 'relative'
      }}
    >
      {/* Top row: Logo, Name & Badges */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: subscription.brandColor || '#6366f1',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)'
              }}
            >
              {subscription.iconText || subscription.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {subscription.name}
              </h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {subscription.planName || 'Standard Plan'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
            <StatusBadge status={subscription.status} isTrial={subscription.isFreeTrial} />
            <CategoryBadge category={subscription.category} />
          </div>
        </div>

        {/* Cost & Cycle */}
        <div style={{ margin: '0.75rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {formatAmount(subscription.cost)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              /{subscription.billingCycle}
            </span>
          </div>
        </div>

        {/* Renewal Countdown Badge */}
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: isUrgent ? 'rgba(244, 63, 94, 0.15)' : isOverdue ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-badge)',
            border: isUrgent ? '1px solid rgba(244, 63, 94, 0.3)' : isOverdue ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.775rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isUrgent ? 'var(--accent-rose)' : isOverdue ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
            <Clock size={14} />
            <span>
              {subscription.isFreeTrial ? 'Trial expires: ' : 'Next renewal: '}
              <strong>{targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          </div>
          <span style={{ fontWeight: 700, color: isUrgent ? 'var(--accent-rose)' : isOverdue ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
            {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'In 1 day' : daysLeft > 1 ? `In ${daysLeft} days` : 'Past due'}
          </span>
        </div>

        {/* Payment Method and Notes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CreditCard size={13} />
            <span>{subscription.paymentMethod || 'Credit Card'}</span>
          </span>
          {subscription.notes && (
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={subscription.notes}>
              {subscription.notes}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <button
          type="button"
          onClick={() => renewSubscription(subscription.id)}
          className="btn btn-sm btn-success"
          style={{ fontSize: '0.75rem' }}
          title="Mark subscription as renewed (advances date by 1 billing cycle)"
        >
          <RefreshCw size={12} />
          <span>Renew</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => togglePauseSubscription(subscription.id)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
            title={subscription.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
          >
            {subscription.status === 'paused' ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
          </button>
          <button
            type="button"
            onClick={() => onEdit(subscription)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
            title="Edit Subscription"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => deleteSubscription(subscription.id)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.35rem', color: 'var(--accent-rose)' }}
            title="Delete Subscription"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
