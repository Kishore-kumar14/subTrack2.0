import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { CategoryBadge, StatusBadge } from '../common/Badge';
import SubscriptionIcon from '../common/SubscriptionIcon';
import { RefreshCw, Edit2, Trash2, PauseCircle, PlayCircle, ExternalLink } from 'lucide-react';

export default function SubscriptionTable({ subscriptions, onEdit }) {
  const { formatAmount } = useAuth();
  const { renewSubscription, deleteSubscription, togglePauseSubscription } = useSubscriptions();

  return (
    <div
      className="glass-panel"
      style={{
        overflowX: 'auto',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)'
            }}
          >
            <th style={{ padding: '0.9rem 1.25rem' }}>Service</th>
            <th style={{ padding: '0.9rem 1rem' }}>Category</th>
            <th style={{ padding: '0.9rem 1rem' }}>Cost</th>
            <th style={{ padding: '0.9rem 1rem' }}>Cycle</th>
            <th style={{ padding: '0.9rem 1rem' }}>Next Renewal</th>
            <th style={{ padding: '0.9rem 1rem' }}>Payment</th>
            <th style={{ padding: '0.9rem 1rem' }}>Status</th>
            <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.875rem' }}>
          {subscriptions.map(sub => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate);
            targetDate.setHours(0, 0, 0, 0);
            const diffTime = targetDate - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = daysLeft <= 3 && daysLeft >= 0 && sub.status !== 'cancelled' && sub.status !== 'paused';

            return (
              <tr
                key={sub.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Service Name & Icon */}
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <SubscriptionIcon subscription={sub} size={34} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sub.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{sub.planName || 'Plan'}</div>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td style={{ padding: '1rem' }}>
                  <CategoryBadge category={sub.category} />
                </td>

                {/* Cost */}
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatAmount(sub.cost)}
                </td>

                {/* Cycle */}
                <td style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                  {sub.billingCycle}
                </td>

                {/* Next Renewal */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ color: isUrgent ? 'var(--accent-rose)' : 'var(--text-primary)', fontWeight: isUrgent ? 700 : 500 }}>
                    {targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isUrgent ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                    {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Tomorrow' : daysLeft > 1 ? `In ${daysLeft} days` : 'Past due'}
                  </div>
                </td>

                {/* Payment Method */}
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {sub.paymentMethod}
                </td>

                {/* Status */}
                <td style={{ padding: '1rem' }}>
                  <StatusBadge status={sub.status} isTrial={sub.isFreeTrial} />
                </td>

                {/* Actions */}
                <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => renewSubscription(sub.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-emerald)', padding: '0.3rem' }}
                      title="Mark Renewed"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePauseSubscription(sub.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text-muted)', padding: '0.3rem' }}
                      title={sub.status === 'paused' ? 'Resume' : 'Pause'}
                    >
                      {sub.status === 'paused' ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(sub)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text-muted)', padding: '0.3rem' }}
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSubscription(sub.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-rose)', padding: '0.3rem' }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
