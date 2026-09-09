import React from 'react';
import {
  Calendar,
  Zap,
  ArrowRight,
  LogIn,
  UserPlus,
  Bell
} from 'lucide-react';

import Logo from '../components/common/Logo';

import { useAuth } from '../context/AuthContext';

export default function HomePage({ onNavigateToApp }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page-container animate-fade-in" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section
        style={{
          textAlign: 'center',
          padding: '2.5rem 1rem 3rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Full Brand Logo Showcase with Tagline */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Logo size="lg" showTagline={true} />
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem',
            maxWidth: '850px'
          }}
        >
          Never Get Billed for a{' '}
          <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Forgotten Subscription
          </span>{' '}
          Again
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6
          }}
        >
          SubTrack brings your streaming, software, gym, and cloud subscriptions into one single dashboard.
          Monitor costs, visualize spending analytics, and receive timely alerts before renewals and free trials expire.
        </p>

        {/* Primary Call To Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => onNavigateToApp('dashboard')}
                className="btn btn-primary btn-lg"
                style={{ fontWeight: 700, padding: '0.9rem 2.25rem' }}
              >
                <span>Go to Your Dashboard</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onNavigateToApp('login')}
                className="btn btn-secondary btn-lg"
                style={{ fontWeight: 700, padding: '0.9rem 2rem' }}
              >
                <LogIn size={18} />
                <span>Switch / Sign In</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigateToApp('login')}
                className="btn btn-primary btn-lg"
                style={{ fontWeight: 700, padding: '0.9rem 2.25rem' }}
              >
                <LogIn size={20} />
                <span>Sign In to Your Account</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onNavigateToApp('signup')}
                className="btn btn-secondary btn-lg"
                style={{ fontWeight: 700, padding: '0.9rem 2rem' }}
              >
                <UserPlus size={20} />
                <span>Create Free Account</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* How SubTrack Works (3 Clean Steps) */}
      <section style={{ margin: '3rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Simple Workflow</span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>How SubTrack Keeps You in Control</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Step 1 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Sign In & Add Services</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Log in to access your dashboard. Choose from our 20+ recharge-style pre-built plans (Netflix, Spotify, ChatGPT Plus, Cult.fit) or add custom subscriptions with one click.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Track Trials & Renewals</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Receive urgent Action Center notifications before free trials expire or regular renewals strike. Easily renew, cancel, or snooze alerts with a single click.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Visualize In Calendar & Charts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              View upcoming payment dates in a visual monthly calendar and inspect deep analytics by category, cycle, and payment method to optimize your expenses.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

