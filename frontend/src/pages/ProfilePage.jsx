import React, { useState } from 'react';
import { useAuth, CURRENCY_CONFIG } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { api } from '../services/api';
import {
  User,
  DollarSign,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Shield,
  Sparkles,
  AlertCircle,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
];

export default function ProfilePage() {
  const { user, currency, changeCurrency, updateProfile } = useAuth();
  const { subscriptions, clearAllSubscriptions, importSubscriptions, dbConnected, dbStatus } = useSubscriptions();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [alertDays, setAlertDays] = useState(user?.preferences?.alertDaysBefore || 3);
  const [browserAlerts, setBrowserAlerts] = useState(user?.preferences?.browserAlerts ?? true);
  const [emailAlerts, setEmailAlerts] = useState(user?.preferences?.emailAlerts ?? true);

  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const calendarFeedUrl = api.getCalendarFeedUrl(user?.id);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      avatar,
      preferences: {
        ...user?.preferences,
        alertDaysBefore: alertDays,
        browserAlerts,
        emailAlerts
      }
    });

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch (err) {}

    setStatusMessage({ type: 'success', text: 'Profile preferences updated and synced successfully!' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    setSendingEmail(true);
    try {
      await api.resendConfirmationEmail(user.email);
      setStatusMessage({ type: 'success', text: `Confirmation email dispatched to ${user.email}!` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Could not send confirmation email' });
    } finally {
      setSendingEmail(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCopyFeedUrl = () => {
    if (!calendarFeedUrl) return;
    navigator.clipboard.writeText(calendarFeedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const handleOpenGoogleCalendarWeb = () => {
    if (!calendarFeedUrl) return;
    const url = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarFeedUrl)}`;
    window.open(url, '_blank');
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        currency
      },
      subscriptions
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `subtrack_backup_${user?.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatusMessage({ type: 'success', text: 'Backup file exported successfully!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = importSubscriptions(json);
        if (res.success) {
          setStatusMessage({ type: 'success', text: `Successfully imported ${res.count} subscriptions!` });
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Failed to import JSON file' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Invalid JSON format in uploaded file' });
      }
      setTimeout(() => setStatusMessage(null), 3500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="profile-page-container animate-fade-in" style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
          Account Settings & Preferences
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage your personal profile, Google Calendar notifications, and data backups
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: statusMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
            color: statusMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* User Profile Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--primary-light)' }} />
            <span>Personal Details</span>
          </h3>

          <button
            type="button"
            disabled={sendingEmail}
            onClick={handleResendConfirmation}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Mail size={14} />
            <span>{sendingEmail ? 'Sending Email...' : 'Resend Confirmation Email'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile}>
          {/* Avatar Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Profile Avatar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <img
                src={avatar}
                alt="Selected Avatar"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {AVATAR_PRESETS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setAvatar(preset)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      objectFit: 'cover',
                      border: avatar === preset ? '2px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                      opacity: avatar === preset ? 1 : 0.6,
                      transition: 'all var(--transition-fast)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Google Calendar Sync & Mobile Notifications Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <Calendar size={22} style={{ color: '#4285F4' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Google Calendar & Mobile Notifications
          </h3>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Connect your SubTrack renewal schedule to Google Calendar so you receive push reminders on your smartphone before subscription charges.
        </p>

        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Your Private Google Calendar Subscription URL
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Contains automated reminders for all active plans. Compatible with Google Calendar, Apple Calendar, and Outlook.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleOpenGoogleCalendarWeb}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ExternalLink size={14} />
                <span>1-Click Add to Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/api/calendar/${user?.id}/feed.ics`, '_blank')}
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} />
                <span>Download .ics File</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              className="form-control"
              value={calendarFeedUrl || ''}
              style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={handleCopyFeedUrl}
              className="btn btn-secondary"
              style={{ flexShrink: 0 }}
            >
              {copiedFeed ? <Check size={16} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={16} />}
              <span>{copiedFeed ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>

          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            💡 <strong>How to get phone notifications:</strong> Once added to Google Calendar, enable notifications in your phone's Google Calendar app settings. You will automatically receive mobile push alerts 3 days and 1 day prior to each subscription payment.
          </div>
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} style={{ color: 'var(--accent-emerald)' }} />
          <span>Active Display Currency</span>
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Choose your primary currency. All costs and budgets are converted dynamically.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.keys(CURRENCY_CONFIG).map((curKey) => {
            const config = CURRENCY_CONFIG[curKey];
            const isSelected = currency === curKey;
            return (
              <div
                key={curKey}
                onClick={() => changeCurrency(curKey)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-badge)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                  {config.symbol}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>{curKey}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{config.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} style={{ color: 'var(--accent-cyan)' }} />
              <span>Database & Data Portability</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Subscriptions are strictly scoped to your login account (<strong>{user?.email}</strong>).
            </p>
          </div>

          {/* MongoDB Connection Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: dbConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${dbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.775rem',
              fontWeight: 700,
              color: dbConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: dbConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                boxShadow: dbConnected ? '0 0 8px var(--accent-emerald)' : 'none'
              }}
            />
            <span>MongoDB: {dbConnected ? 'Connected' : 'Offline / Local Mode'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportJSON}
            className="btn btn-secondary"
          >
            <Download size={16} />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={16} />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove all your subscriptions?')) {
                clearAllSubscriptions();
                setStatusMessage({ type: 'success', text: 'All your subscriptions cleared from MongoDB and local storage.' });
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Clear My Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
