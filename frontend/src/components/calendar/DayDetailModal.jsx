import React from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { CategoryBadge, StatusBadge } from '../common/Badge';
import SubscriptionIcon from '../common/SubscriptionIcon';
import { CreditCard, RefreshCw } from 'lucide-react';

export default function DayDetailModal({ isOpen, onClose, date, daySubscriptions = [] }) {
  const { formatAmount } = useAuth();
  const { renewSubscription } = useSubscriptions();

  const totalDaySpend = daySubscriptions.reduce((acc, sub) => acc + Number(sub.cost || 0), 0);

  const formattedDate = date ? new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Renewals for ${formattedDate}`}
      maxWidth="540px"
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total Outflow for this Date
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {formatAmount(totalDaySpend)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {daySubscriptions.map(sub => (
          <div
            key={sub.id}
            className="glass-panel"
            style={{
              padding: '1rem',
              borderLeft: `4px solid ${sub.brandColor || 'var(--primary)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SubscriptionIcon subscription={sub} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {sub.planName} • via {sub.paymentMethod}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'var(--font-heading)' }}>
                  {formatAmount(sub.cost)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {sub.billingCycle}
                </div>
              </div>

              <button
                type="button"
                onClick={() => renewSubscription(sub.id)}
                className="btn btn-sm btn-success"
                style={{ padding: '0.4rem 0.6rem' }}
                title="Mark Renewed"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
