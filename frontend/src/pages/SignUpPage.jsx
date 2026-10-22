import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  X
} from 'lucide-react';
import Logo from '../components/common/Logo';

export default function SignUpPage({ onNavigate }) {
  const { isAuthenticated, signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // If already authenticated, redirect to dashboard automatically
  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('dashboard');
    }
  }, [isAuthenticated, onNavigate]);

  // Standard password security conditions
  const securityConditions = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'number', label: 'At least 1 number (0–9)', met: /\d/.test(password) },
    { id: 'symbol', label: 'At least 1 symbol (e.g. !@#$%^&*)', met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) },
    { id: 'uppercase', label: 'At least 1 uppercase letter (A–Z)', met: /[A-Z]/.test(password) }
  ];

  const metCount = securityConditions.filter(c => c.met).length;
  const isPasswordValid = metCount === securityConditions.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isPasswordValid) {
      setErrorMessage('Please satisfy all password security conditions before continuing.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup({ name, email, password, currency: 'INR' });
      setSuccessMessage(`Account created! A confirmation email has been dispatched to ${email}. Redirecting...`);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    if (!googleEmailInput) return;
    setLoading(true);
    try {
      await loginWithGoogle({
        email: googleEmailInput,
        name: googleNameInput || googleEmailInput.split('@')[0],
        googleId: `g-${Date.now()}`
      });
      setShowGoogleModal(false);
      setSuccessMessage(`Google account connected! A confirmation email has been dispatched to ${googleEmailInput}. Redirecting...`);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
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
          maxWidth: '480px',
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
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Start tracking subscriptions, free trials & expenses today
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Google Sign Up Option */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: '1px solid var(--border-medium)',
            background: 'rgba(255, 255, 255, 0.05)',
            marginBottom: '1.25rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or register with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User
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
                type="text"
                required
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. Kishore Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address (You will receive confirmation)</label>
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

          {/* Password with Security Conditions */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
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
                placeholder="Create a strong password"
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
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            <div style={{ marginTop: '0.6rem' }}>
              <div
                style={{
                  height: '4px',
                  width: '100%',
                  backgroundColor: 'rgba(128, 128, 128, 0.2)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(metCount / 4) * 100}%`,
                    backgroundColor:
                      metCount <= 1
                        ? 'var(--accent-rose)'
                        : metCount <= 3
                        ? 'var(--accent-amber)'
                        : 'var(--accent-emerald)',
                    transition: 'all 300ms ease'
                  }}
                />
              </div>

              {/* Conditions Checklist */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-badge)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} style={{ color: isPasswordValid ? 'var(--accent-emerald)' : 'var(--primary-light)' }} />
                  <span>Standard Password Requirements:</span>
                </div>
                {securityConditions.map((cond) => (
                  <div
                    key={cond.id}
                    style={{
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: cond.met ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      fontWeight: cond.met ? 600 : 400,
                      transition: 'color var(--transition-fast)'
                    }}
                  >
                    {cond.met ? (
                      <CheckCircle2 size={13} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                    ) : (
                      <XCircle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                    <span>{cond.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            <span>{loading ? 'Creating Account & Sending Confirmation...' : 'Create Account & Continue'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="btn-ghost"
            style={{ color: 'var(--primary-light)', fontWeight: 700, padding: 0 }}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* Google Connect Modal */}
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
              maxWidth: '420px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-medium)',
              position: 'relative'
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Sign up with Google</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Connect Google and receive confirmation</p>
              </div>
            </div>

            <form onSubmit={handleGoogleSignup}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Google Account Email</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="yourname@gmail.com"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Kishore Kumar"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem' }}
              >
                <span>{loading ? 'Creating Account...' : 'Complete Google Sign Up'}</span>
                <CheckCircle2 size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
