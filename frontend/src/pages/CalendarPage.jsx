import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  CreditCard,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  RotateCw,
  Unlink,
  Zap,
  Info
} from 'lucide-react';
import SubscriptionIcon from '../components/common/SubscriptionIcon';

export default function CalendarPage() {
  const {
    subscriptions,
    renewSubscription,
    calendarStatus,
    refreshCalendarStatus,
    connectCalendar,
    disconnectCalendar,
    reconcileCalendar
  } = useSubscriptions();
  const { user, formatAmount } = useAuth();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'agenda'
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [syncingRealtime, setSyncingRealtime] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const [selectedDayData, setSelectedDayData] = useState({
    isOpen: false,
    date: null,
    subscriptions: []
  });

  // Direct Google Calendar OAuth Connection via Google Calendar API v3
  const directGoogleSync = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onSuccess: async (tokenResponse) => {
      setSyncingRealtime(true);
      setSyncResult(null);
      try {
        const res = await connectCalendar({
          accessToken: tokenResponse.access_token,
          expiresIn: tokenResponse.expires_in
        });

        // Also run idempotent reconciliation
        const reconcileRes = await api.reconcileGoogleCalendar(user?.id, tokenResponse.access_token);
        await refreshCalendarStatus();

        setSyncResult({
          type: 'success',
          text: `Google Calendar connected! ${reconcileRes.message || 'All renewal reminders synchronized.'}`
        });
      } catch (err) {
        setSyncResult({
          type: 'error',
          text: err.message || 'Failed to connect with Google Calendar API.'
        });
      } finally {
        setSyncingRealtime(false);
      }
    },
    onError: (err) => {
      setSyncResult({
        type: 'error',
        text: 'Google authorization was closed or denied. You can click Sync Google Calendar again to re-authorize.'
      });
    }
  });

  const handleManualReconcile = async () => {
    setSyncingRealtime(true);
    setSyncResult(null);
    try {
      const res = await reconcileCalendar();
      setSyncResult({
        type: 'success',
        text: res?.message || 'Synchronization and deduplication complete! All calendar events are aligned.'
      });
    } catch (err) {
      setSyncResult({
        type: 'error',
        text: err.message || 'Failed to reconcile calendar.'
      });
    } finally {
      setSyncingRealtime(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar? Automatic sync will pause.')) {
      return;
    }
    setSyncingRealtime(true);
    try {
      await disconnectCalendar();
      setSyncResult({
        type: 'success',
        text: 'Google Calendar has been disconnected.'
      });
    } catch (err) {
      setSyncResult({
        type: 'error',
        text: err.message || 'Failed to disconnect.'
      });
    } finally {
      setSyncingRealtime(false);
    }
  };

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

  const isConnected = calendarStatus?.connected;
  const isSyncError = calendarStatus?.syncStatus === 'error';

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Sync to Google Calendar Button */}
          <button
            type="button"
            disabled={syncingRealtime}
            onClick={isConnected ? () => setShowGoogleModal(true) : () => directGoogleSync()}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.95rem',
              fontWeight: 700,
              border: isConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-medium)',
              background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(66, 133, 244, 0.12)',
              color: 'var(--text-primary)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{syncingRealtime ? 'Connecting...' : isConnected ? 'Google Calendar Connected' : 'Sync Google Calendar'}</span>
          </button>

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
      </div>

      {/* Sync Feedback Message (if active) */}
      {syncResult && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: syncResult.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: syncResult.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
            color: syncResult.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {syncResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{syncResult.text}</span>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main View */}
      {viewMode === 'grid' ? (
        <CalendarGrid onSelectDay={handleSelectDay} />
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Chronological Upcoming Renewals
          </h3>

          {agendaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No upcoming renewals scheduled. Add a subscription with a renewal date to see it here!
            </div>
          ) : (
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

                  {/* Due Date Details & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
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
          )}
        </div>
      )}

      {/* Google Calendar Sync & Options Modal */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '620px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-medium)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <button
              onClick={() => setShowGoogleModal(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(66, 133, 244, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={24} style={{ color: '#4285F4' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Google Calendar Synchronization
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Automatic 2-way synchronization with your primary Google Calendar
                </p>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncResult && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: syncResult.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: syncResult.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  color: syncResult.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem'
                }}
              >
                {syncResult.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{syncResult.text}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Direct Google Calendar Synchronization */}
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(66, 133, 244, 0.1)',
                  border: isConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(66, 133, 244, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '1rem', color: isConnected ? 'var(--accent-emerald)' : 'var(--primary-light)' }}>
                    <Zap size={18} />
                    <span>Direct Google Calendar Synchronization</span>
                  </div>
                  <span className={`badge ${isConnected ? 'badge-emerald' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                    {isConnected ? 'Active & Auto-Syncing' : 'Disconnected'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                  SubTrack connects directly to your Google Calendar API. <strong>Automatic synchronization</strong> triggers whenever a subscription is created, updated, renewed, or deleted. Uses persistent event IDs to guarantee <strong>no duplicate events</strong>, and schedules pop-up notifications <strong>3 days</strong> and <strong>1 day</strong> before payment dates.
                </div>

                {isConnected ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={syncingRealtime}
                      onClick={handleManualReconcile}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem 1rem' }}
                    >
                      <RotateCw size={14} className={syncingRealtime ? 'animate-spin' : ''} />
                      <span>{syncingRealtime ? 'Reconciling...' : 'Reconcile & Clean Duplicates'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="btn btn-danger btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem' }}
                    >
                      <Unlink size={14} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={syncingRealtime}
                    onClick={() => directGoogleSync()}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.85rem 1.25rem', fontSize: '0.95rem', fontWeight: 700 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{syncingRealtime ? 'Connecting Google Calendar...' : 'Authorize Google Calendar (Automatic 2-Way Sync)'}</span>
                  </button>
                )}
              </div>
            </div>
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
