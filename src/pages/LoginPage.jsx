import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Logo from '../components/common/Logo';

export default function LoginPage({ onNavigate }) {
  const { isAuthenticated, login, demoLogin } = useAuth();
  const [email, setEmail] = useState('alex.morgan@subtrack.app');
  const [password, setPassword] = useState('subtrack123');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated, redirect to dashboard automatically
  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('dashboard');
    }
  }, [isAuthenticated, onNavigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    onNavigate('dashboard');
  };

  const handleDemo = () => {
    demoLogin();
    onNavigate('dashboard');
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <Logo size="md" showTagline={true} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Sign in to manage your subscriptions and spending
          </p>
        </div>


        {/* 1-Click Demo Login Box */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Want to test without filling credentials?
          </div>
          <button
            type="button"
            onClick={handleDemo}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', fontWeight: 700 }}
          >
            <Sparkles size={15} />
            <span>1-Click Instant Demo Login</span>
          </button>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="email"
                required
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setForgotSent(true)}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', color: 'var(--primary-light)', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-control"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {forgotSent && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-emerald)',
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.1)'
              }}
            >
              ✓ Password reset link sent to {email}. Check your inbox!
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
          >
            <span>Sign In to Account</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="btn-ghost"
            style={{ color: 'var(--primary-light)', fontWeight: 700, padding: 0 }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
