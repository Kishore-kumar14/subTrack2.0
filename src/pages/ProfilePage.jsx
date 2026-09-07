import React, { useState } from 'react';
import { useAuth, CURRENCY_CONFIG } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
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
  AlertCircle
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
  const { subscriptions, resetToDemoData, clearAllSubscriptions, importSubscriptions } = useSubscriptions();

  const [name, setName] = useState(user?.name || 'Alex Morgan');
  const [email, setEmail] = useState(user?.email || 'alex.morgan@subtrack.app');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [alertDays, setAlertDays] = useState(user?.preferences?.alertDaysBefore || 3);
  const [browserAlerts, setBrowserAlerts] = useState(user?.preferences?.browserAlerts ?? true);
  const [emailAlerts, setEmailAlerts] = useState(user?.preferences?.emailAlerts ?? true);

  const [statusMessage, setStatusMessage] = useState(null);

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
    setStatusMessage({ type: 'success', text: 'Profile preferences saved successfully!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user,
      subscriptions
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `subtrack_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON
  const handleFileImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const result = importSubscriptions(parsed);
        if (result.success) {
          setStatusMessage({ type: 'success', text: `Imported ${result.count} subscriptions successfully!` });
          try {
            confetti({ particleCount: 30, spread: 50 });
          } catch (err) {}
        } else {
          setStatusMessage({ type: 'error', text: `Import failed: ${result.error}` });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Invalid JSON file format' });
      }
    };
    fileReader.readAsText(file);
  };

  // Trigger test browser alert notification
  const handleTestNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('SubTrack Alert', {
          body: 'Netflix renewal scheduled in 2 days. Cost: ' + currency + ' 649',
          icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('SubTrack Alert', {
              body: 'SubTrack notification enabled!'
            });
          }
        });
      }
    }
    setStatusMessage({ type: 'success', text: 'Simulated alert fired! Check notification drawer.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="profile-page-container animate-fade-in" style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
          Account Settings & Preferences
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage your personal profile, primary currency, notification rules, and data backups
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
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} style={{ color: 'var(--primary-light)' }} />
          <span>Personal Details</span>
        </h3>

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
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <span>Save Profile Changes</span>
          </button>
        </form>
      </div>

      {/* Currency & Region */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} style={{ color: 'var(--accent-emerald)' }} />
          <span>Primary Currency & Formatting</span>
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          All prices, burn rates, calendar payments, and analytics will instantly recalculate to your chosen currency.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {Object.keys(CURRENCY_CONFIG).map(curKey => {
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

      {/* Notification Rules */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} style={{ color: 'var(--accent-amber)' }} />
          <span>Renewal Alerts & Action Center</span>
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Configure advance warning timelines for renewals and free trials.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Days Before Renewal Alert</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                When to surface upcoming renewal badges in your Action Center
              </div>
            </div>
            <select
              className="form-control"
              style={{ width: '180px' }}
              value={alertDays}
              onChange={(e) => setAlertDays(Number(e.target.value))}
            >
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before (Recommended)</option>
              <option value={7}>7 days before</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Urgent Free-Trial Expiration Notifications</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Highlight expiring trials with high urgency so you don't get auto-charged
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={browserAlerts}
                onChange={(e) => setBrowserAlerts(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleTestNotification}
              className="btn btn-secondary btn-sm"
            >
              <Bell size={14} />
              <span>Send Test Notification</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--accent-cyan)' }} />
          <span>Data Portability & Backups</span>
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You own your subscription data. Export complete backups, restore from JSON, or reset to rich demo data.
        </p>

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
              resetToDemoData();
              setStatusMessage({ type: 'success', text: 'Demo subscriptions restored successfully!' });
              setTimeout(() => setStatusMessage(null), 3000);
            }}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} />
            <span>Reset to Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove all subscriptions?')) {
                clearAllSubscriptions();
                setStatusMessage({ type: 'success', text: 'All subscriptions cleared.' });
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
