import React, { useState } from 'react';
import { useAuth, CURRENCY_CONFIG } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import {
  Bell,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  Layers,
  Calendar,
  PieChart,
  Home,
  LogIn,
  UserPlus,
  ArrowRight
} from 'lucide-react';


import Logo from '../common/Logo';

export default function Navbar({ activePage, setActivePage, onOpenAddModal, onOpenNotifications }) {
  const { user, isAuthenticated, currency, changeCurrency, theme, toggleTheme, logout, demoLogin } = useAuth();
  const { urgentAlerts } = useSubscriptions();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isAppView = isAuthenticated && activePage !== 'home' && activePage !== 'login' && activePage !== 'signup';

  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Logo
          size="sm"
          onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'home')}
        />


        {/* Desktop Navigation Links — ONLY shown when inside App */}
        {isAppView && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            className="desktop-nav"
          >
            <button
              onClick={() => setActivePage('dashboard')}
              className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Layers size={15} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActivePage('subscriptions')}
              className={`btn btn-sm ${activePage === 'subscriptions' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <span>Subscriptions</span>
            </button>
            <button
              onClick={() => setActivePage('calendar')}
              className={`btn btn-sm ${activePage === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Calendar size={15} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActivePage('analytics')}
              className={`btn btn-sm ${activePage === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <PieChart size={15} />
              <span>Analytics</span>
            </button>
          </nav>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* NON-APP / HOME / AUTH VIEW CONTROLS */}
        {!isAppView && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isAuthenticated ? (
              <button
                onClick={() => setActivePage('dashboard')}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <span>Dashboard</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActivePage('login')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setActivePage('signup')}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* AUTHENTICATED APP VIEW CONTROLS */}
        {isAppView && (
          <>
            {/* Quick Add Subscription CTA */}
            <button
              onClick={onOpenAddModal}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>Add Subscription</span>
            </button>

            {/* Currency Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setCurrencyDropdownOpen(prev => !prev)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.75rem', gap: '0.35rem', fontWeight: 700 }}
              >
                <span>{CURRENCY_CONFIG[currency]?.symbol}</span>
                <span style={{ fontSize: '0.8rem' }}>{currency}</span>
                <ChevronDown size={14} />
              </button>

              {currencyDropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '180px',
                    padding: '0.4rem',
                    zIndex: 200,
                    background: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-xl)'
                  }}
                >
                  {Object.keys(CURRENCY_CONFIG).map(curKey => (
                    <button
                      key={curKey}
                      onClick={() => {
                        changeCurrency(curKey);
                        setCurrencyDropdownOpen(false);
                      }}
                      className="btn btn-ghost"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.825rem',
                        fontWeight: currency === curKey ? 700 : 500,
                        color: currency === curKey ? 'var(--primary-light)' : 'var(--text-primary)',
                        background: currency === curKey ? 'var(--bg-badge)' : 'transparent'
                      }}
                    >
                      <span style={{ width: '20px', fontWeight: 800 }}>{CURRENCY_CONFIG[curKey].symbol}</span>
                      <span>{CURRENCY_CONFIG[curKey].name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', position: 'relative' }}
              title="Action Center Alerts"
            >
              <Bell size={18} />
              {urgentAlerts.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-rose)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)'
                  }}
                >
                  {urgentAlerts.length}
                </span>
              )}
            </button>

            {/* User Profile Avatar Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user?.name || 'User'}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary-light)'
                  }}
                />
              </div>

              {profileDropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '210px',
                    padding: '0.6rem',
                    zIndex: 200,
                    background: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-xl)'
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActivePage('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}
                  >
                    <User size={15} />
                    <span>Profile & Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      demoLogin();
                      setProfileDropdownOpen(false);
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.825rem', color: 'var(--primary-light)' }}
                  >
                    <Sparkles size={15} />
                    <span>Reset Demo Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setActivePage('home');
                      setProfileDropdownOpen(false);
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.825rem', color: 'var(--accent-rose)' }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
