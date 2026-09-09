import React, { useState } from 'react';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, List, Clock, CreditCard, RefreshCw } from 'lucide-react';
import SubscriptionIcon from '../components/common/SubscriptionIcon';

export default function CalendarPage() {
  const { subscriptions, renewSubscription } = useSubscriptions();
  const { formatAmount } = useAuth();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'agenda'
  const [selectedDayData, setSelectedDayData] = useState({
    isOpen: false,
    date: null,
    subscriptions: []
  });

  const handleSelectDay = (dateString, subsForDay) => {
    setSelectedDayData({
      isOpen: true,
      date: dateString,
      subscriptions: subsForDay
    });
  };

  const handleCloseDayModal = () => {
    setSelectedDayData({
      isOpen: false,
      date: null,
      subscriptions: []
    });
  };

  // Agenda view: all upcoming active renewals sorted by date
  const agendaList = subscriptions
    .filter(s => s.status !== 'cancelled' && s.status !== 'paused' && s.nextRenewalDate)
    .map(sub => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const renewal = new Date(sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate);
      renewal.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
      return { ...sub, daysLeft, targetDate: renewal };
    })
    .sort((a, b) => a.targetDate - b.targetDate);

  return (
    <div className="calendar-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            Renewal Calendar
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Track renewal dates, free-trial countdowns, and upcoming payment schedules
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setViewMode('grid')}
            className="btn btn-sm"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <CalendarIcon size={16} />
            <span>Monthly Grid</span>
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className="btn btn-sm"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'agenda' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'agenda' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <List size={16} />
            <span>Upcoming Agenda</span>
          </button>
        </div>
      </div>

      {/* Main View */}
      {viewMode === 'grid' ? (
        <CalendarGrid onSelectDay={handleSelectDay} />
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Chronological Upcoming Renewals
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {agendaList.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  borderLeft: `4px solid ${item.brandColor || 'var(--primary)'}`,
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <SubscriptionIcon subscription={item} size={36} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.planName} • via {item.paymentMethod}
                    </div>
                  </div>
                </div>

                {/* Due Date Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: item.daysLeft <= 3 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                      {item.targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: item.daysLeft <= 3 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                      {item.daysLeft === 0 ? 'Due Today' : item.daysLeft === 1 ? 'Due Tomorrow' : `In ${item.daysLeft} days`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                      {formatAmount(item.cost)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.billingCycle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => renewSubscription(item.id)}
                    className="btn btn-sm btn-success"
                    title="Mark Renewed"
                  >
                    <RefreshCw size={14} />
                    <span>Renew</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Detail Popover Modal */}
      <DayDetailModal
        isOpen={selectedDayData.isOpen}
        onClose={handleCloseDayModal}
        date={selectedDayData.date}
        daySubscriptions={selectedDayData.subscriptions}
      />
    </div>
  );
}
