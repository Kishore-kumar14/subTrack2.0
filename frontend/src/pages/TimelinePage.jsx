import React from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import RenewalTimeline from '../components/subscriptions/RenewalTimeline';
import StatCard from '../components/common/StatCard';
import {
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  HelpCircle
} from 'lucide-react';

export default function TimelinePage({ onNavigate, onEditSubscription, onOpenAddModal }) {
  const { subscriptions, upcomingRenewals, urgentAlerts } = useSubscriptions();
  const { formatAmount } = useAuth();

  return (
    <div className="timeline-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            Subscription Renewal Timeline
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Interactive Gantt timeline displaying your active billing cycles, renewal deadlines, and overlapping cash-flow peaks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>Add Subscription</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('calendar')}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Calendar size={15} />
              <span>Calendar Grid</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Renewal Timeline Component */}
      <RenewalTimeline
        onEditSubscription={onEditSubscription}
        onOpenAddModal={onOpenAddModal}
      />
    </div>
  );
}
