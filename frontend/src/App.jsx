import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Navbar from './components/layout/Navbar';
import NotificationDrawer from './components/layout/NotificationDrawer';
import AddSubscriptionModal from './components/subscriptions/AddSubscriptionModal';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import AddSubscriptionPage from './pages/AddSubscriptionPage';
import ServicePlansPage from './pages/ServicePlansPage';
import TimelinePage from './pages/TimelinePage';

import { Home, LayoutDashboard, Calendar, PieChart, CreditCard, User, Plus, Clock } from 'lucide-react';

function SubTrackMain() {
  const { isAuthenticated } = useAuth();

  const getPageInfoFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    const [pagePart, queryPart] = hash.split('?');
    const params = new URLSearchParams(queryPart || '');
    const validPages = [
      'home', 'login', 'signup', 'dashboard', 'subscriptions', 'timeline',
      'calendar', 'analytics', 'profile', 'add-subscription', 'select-plan'
    ];
    const page = validPages.includes(pagePart) ? pagePart : 'home';
    const serviceId = params.get('service') || null;
    return { page, serviceId };
  };

  const initialInfo = getPageInfoFromHash();
  const [activePage, setActivePage] = useState(initialInfo.page);
  const [selectedProviderId, setSelectedProviderId] = useState(initialInfo.serviceId);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Navigate helper that synchronizes URL hash and scrolls to top
  const navigateTo = (target) => {
    const [pagePart, queryPart] = target.split('?');
    const params = new URLSearchParams(queryPart || '');
    const serviceId = params.get('service') || null;

    setActivePage(pagePart);
    setSelectedProviderId(serviceId);
    window.location.hash = target;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Listen to browser forward/back buttons and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const info = getPageInfoFromHash();
      setActivePage(info.page);
      setSelectedProviderId(info.serviceId);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // When user clicks Add Subscription, navigate to dedicated Add Subscription page
  const handleOpenAddModal = () => {
    navigateTo('add-subscription');
  };

  const handleEditSubscription = (sub) => {
    setEditingSubscription(sub);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingSubscription(null);
  };

  // If not authenticated and trying to access an internal app page, redirect to login
  const isAppView = isAuthenticated && activePage !== 'home' && activePage !== 'login' && activePage !== 'signup';

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        onOpenAddModal={handleOpenAddModal}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {/* Main Content View */}
      <main className="app-content-area">
        {activePage === 'home' && (
          <HomePage
            onNavigateToApp={navigateTo}
          />
        )}

        {activePage === 'login' && (
          <LoginPage onNavigate={navigateTo} />
        )}

        {activePage === 'signup' && (
          <SignUpPage onNavigate={navigateTo} />
        )}

        {activePage === 'dashboard' && (
          isAuthenticated ? (
            <DashboardPage
              onNavigate={navigateTo}
              onOpenAddModal={handleOpenAddModal}
              onEditSubscription={handleEditSubscription}
            />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'subscriptions' && (
          isAuthenticated ? (
            <SubscriptionsPage
              onOpenAddModal={handleOpenAddModal}
              onEditSubscription={handleEditSubscription}
            />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'timeline' && (
          isAuthenticated ? (
            <TimelinePage
              onNavigate={navigateTo}
              onEditSubscription={handleEditSubscription}
              onOpenAddModal={handleOpenAddModal}
            />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'calendar' && (
          isAuthenticated ? (
            <CalendarPage />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'analytics' && (
          isAuthenticated ? (
            <AnalyticsPage />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'profile' && (
          isAuthenticated ? (
            <ProfilePage />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'add-subscription' && (
          isAuthenticated ? (
            <AddSubscriptionPage
              onSelectProvider={(provider) => {
                setSelectedProvider(provider);
                navigateTo(`select-plan?service=${provider.id}`);
              }}
              onCustomSubscription={() => {
                setSelectedProvider(null);
                navigateTo('select-plan?service=custom');
              }}
              onBack={() => navigateTo('subscriptions')}
            />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}

        {activePage === 'select-plan' && (
          isAuthenticated ? (
            <ServicePlansPage
              provider={selectedProvider}
              providerId={selectedProviderId}
              onBack={() => navigateTo('add-subscription')}
              onSuccess={() => navigateTo('subscriptions')}
            />
          ) : (
            <LoginPage onNavigate={navigateTo} />
          )
        )}
      </main>


      {/* Bottom Navigation for Mobile Devices: ONLY when inside App */}
      {isAppView && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 90,
            padding: '0 0.5rem'
          }}
          className="mobile-nav"
        >

        <button
          onClick={() => setActivePage('dashboard')}
          className="btn-ghost"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: activePage === 'dashboard' ? 700 : 500,
            color: activePage === 'dashboard' ? 'var(--primary-light)' : 'var(--text-secondary)',
            background: activePage === 'dashboard' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            padding: '5px 10px',
            borderRadius: '10px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActivePage('subscriptions')}
          className="btn-ghost"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: activePage === 'subscriptions' ? 700 : 500,
            color: activePage === 'subscriptions' ? 'var(--primary-light)' : 'var(--text-secondary)',
            background: activePage === 'subscriptions' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            padding: '5px 10px',
            borderRadius: '10px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <CreditCard size={18} />
          <span>Subscriptions</span>
        </button>

        <button
          onClick={() => setActivePage('timeline')}
          className="btn-ghost"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: activePage === 'timeline' ? 700 : 500,
            color: activePage === 'timeline' ? 'var(--primary-light)' : 'var(--text-secondary)',
            background: activePage === 'timeline' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            padding: '5px 10px',
            borderRadius: '10px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Clock size={18} />
          <span>Timeline</span>
        </button>

        {/* Central Add Button */}
        <button
          onClick={handleOpenAddModal}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-20px',
            boxShadow: '0 4px 14px var(--primary-glow)',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Add Subscription"
        >
          <Plus size={24} />
        </button>

        <button
          onClick={() => setActivePage('calendar')}
          className="btn-ghost"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: activePage === 'calendar' ? 700 : 500,
            color: activePage === 'calendar' ? 'var(--primary-light)' : 'var(--text-secondary)',
            background: activePage === 'calendar' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            padding: '5px 10px',
            borderRadius: '10px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Calendar size={18} />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setActivePage('analytics')}
          className="btn-ghost"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: activePage === 'analytics' ? 700 : 500,
            color: activePage === 'analytics' ? 'var(--primary-light)' : 'var(--text-secondary)',
            background: activePage === 'analytics' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            padding: '5px 10px',
            borderRadius: '10px',
            transition: 'all var(--transition-fast)'
          }}
        >
          <PieChart size={18} />
          <span>Analytics</span>
        </button>
      </nav>
      )}

      {/* Global Modals & Drawers */}
      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        editingSubscription={editingSubscription}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SubTrackMain />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
