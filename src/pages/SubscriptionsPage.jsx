import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PAYMENT_METHODS } from '../data/providerCatalog';
import SubscriptionCard from '../components/subscriptions/SubscriptionCard';
import SubscriptionTable from '../components/subscriptions/SubscriptionTable';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export default function SubscriptionsPage({ onOpenAddModal, onEditSubscription }) {
  const { subscriptions } = useSubscriptions();
  const { formatAmount } = useAuth();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All' | 'active' | 'trial' | 'paused' | 'cancelled'
  const [selectedCycle, setSelectedCycle] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [sortBy, setSortBy] = useState('renewal-asc'); // 'renewal-asc' | 'cost-desc' | 'cost-asc' | 'name-asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filter & Sort computation
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      // Search
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        sub.name.toLowerCase().includes(query) ||
        (sub.planName && sub.planName.toLowerCase().includes(query)) ||
        (sub.notes && sub.notes.toLowerCase().includes(query)) ||
        (sub.paymentMethod && sub.paymentMethod.toLowerCase().includes(query));

      // Category
      const matchesCategory = selectedCategory === 'All' || sub.category === selectedCategory;

      // Status
      let matchesStatus = true;
      if (selectedStatus === 'trial') {
        matchesStatus = sub.isFreeTrial || sub.status === 'trial';
      } else if (selectedStatus !== 'All') {
        matchesStatus = sub.status === selectedStatus;
      }

      // Cycle
      const matchesCycle = selectedCycle === 'All' || sub.billingCycle === selectedCycle;

      // Payment
      const matchesPayment = selectedPayment === 'All' || sub.paymentMethod === selectedPayment;

      return matchesSearch && matchesCategory && matchesStatus && matchesCycle && matchesPayment;
    }).sort((a, b) => {
      if (sortBy === 'cost-desc') {
        return Number(b.cost) - Number(a.cost);
      }
      if (sortBy === 'cost-asc') {
        return Number(a.cost) - Number(b.cost);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      // Default: renewal-asc (soonest first)
      const dateA = new Date(a.isFreeTrial && a.trialEndDate ? a.trialEndDate : a.nextRenewalDate || '2099-01-01');
      const dateB = new Date(b.isFreeTrial && b.trialEndDate ? b.trialEndDate : b.nextRenewalDate || '2099-01-01');
      return dateA - dateB;
    });
  }, [subscriptions, searchQuery, selectedCategory, selectedStatus, selectedCycle, selectedPayment, sortBy]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedCycle !== 'All' ||
    selectedPayment !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedCycle('All');
    setSelectedPayment('All');
    setSortBy('renewal-asc');
  };

  return (
    <div className="subscriptions-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            Subscriptions Directory
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Filter, search, organize, and manage all your recurring services
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)'
              }}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)'
              }}
              title="Table List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Top line: Search input + Sort selector */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by name, plan, tags, payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-control"
              style={{ width: '200px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="renewal-asc">Renewal: Soonest First</option>
              <option value="cost-desc">Cost: High to Low</option>
              <option value="cost-asc">Cost: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'none'
          }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.85rem',
                fontSize: '0.775rem',
                fontWeight: 600,
                background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-badge)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <SlidersHorizontal size={14} />
            <span>Refine by:</span>
          </div>

          {/* Status filter */}
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.8rem' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Free Trials</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Billing Cycle filter */}
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.8rem' }}
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
          >
            <option value="All">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="weekly">Weekly</option>
          </select>

          {/* Payment Method filter */}
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.8rem' }}
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
          >
            <option value="All">All Payment Methods</option>
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.775rem', color: 'var(--accent-rose)' }}
            >
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredSubscriptions.length}</strong> of {subscriptions.length}
          </div>
        </div>
      </div>

      {/* Subscription Results Display */}
      {filteredSubscriptions.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <Sparkles size={48} style={{ color: 'var(--primary-light)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No matching subscriptions found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            Try broadening your search or resetting active filters.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="btn btn-secondary">
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredSubscriptions.map(sub => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={onEditSubscription}
            />
          ))}
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={filteredSubscriptions}
          onEdit={onEditSubscription}
        />
      )}
    </div>
  );
}
