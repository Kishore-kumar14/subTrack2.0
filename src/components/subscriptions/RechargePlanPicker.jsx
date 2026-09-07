import React, { useState } from 'react';
import { PROVIDER_CATALOG, CATEGORIES } from '../../data/providerCatalog';
import { useAuth } from '../../context/AuthContext';
import { Search, CheckCircle2, Zap, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

export default function RechargePlanPicker({ onSelectPlan }) {
  const { currency, formatAmount } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(PROVIDER_CATALOG[0]); // Default Netflix selected
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'monthly' | 'yearly'

  // Filter providers by category and search
  const filteredProviders = PROVIDER_CATALOG.filter(provider => {
    const matchesCategory = selectedCategory === 'All' || provider.category === selectedCategory;
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter plans of active provider
  const filteredPlans = selectedProvider?.plans.filter(plan => {
    if (planFilter === 'monthly') return plan.billingCycle === 'monthly';
    if (planFilter === 'yearly') return plan.billingCycle === 'yearly';
    return true;
  }) || [];

  return (
    <div className="recharge-plan-picker-wrapper">
      {/* Search and Category Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
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
            placeholder="Search 20+ services (Netflix, Spotify, ChatGPT, Cult.fit, Prime, Google One...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.4rem',
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
      </div>

      {/* Step 1: Horizontal/Grid Provider Selector (Clickable Operators like Jio/Airtel) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            1. Select App / Service ({filteredProviders.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600 }}>
            Click an app to view recharge plans ↓
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '0.65rem',
            maxHeight: '190px',
            overflowY: 'auto',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {filteredProviders.map(provider => {
            const isSelected = selectedProvider?.id === provider.id;
            return (
              <div
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                className={`provider-card ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '0.75rem 0.5rem',
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  transform: isSelected ? 'scale(1.02)' : 'none'
                }}
              >
                <div
                  className="provider-icon-wrapper"
                  style={{
                    backgroundColor: provider.brandColor,
                    color: '#ffffff',
                    width: '38px',
                    height: '38px',
                    fontSize: '1.1rem'
                  }}
                >
                  {provider.iconText}
                </div>
                <div className="provider-name" style={{ fontSize: '0.78rem' }}>
                  {provider.name}
                </div>
                <div className="provider-category" style={{ fontSize: '0.65rem' }}>
                  {provider.category.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Recharge Plans Grid for the Selected Operator (Jio/Airtel style) */}
      {selectedProvider && (
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {/* Provider Header Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: selectedProvider.brandColor,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}
              >
                {selectedProvider.iconText}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{selectedProvider.name} Plans</h4>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    {selectedProvider.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {selectedProvider.description}
                </p>
              </div>
            </div>

            {/* Plan Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => setPlanFilter('all')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  background: planFilter === 'all' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'all' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                All Plans
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter('monthly')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  background: planFilter === 'monthly' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'monthly' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter('yearly')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  background: planFilter === 'yearly' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'yearly' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                Annual Saver
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="recharge-plans-container">
            {filteredPlans.map(plan => {
              const isPopular = plan.badge.toLowerCase().includes('popular') || plan.badge.toLowerCase().includes('best value');
              return (
                <div
                  key={plan.id}
                  className={`recharge-plan-card ${isPopular ? 'featured' : ''}`}
                >
                  {plan.badge && (
                    <div className="plan-badge-tag">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {plan.billingCycle} Subscription
                    </div>

                    <div className="plan-price-block">
                      <span className="plan-price-amount">
                        {formatAmount(plan.costINR)}
                      </span>
                      <span className="plan-price-period">
                        /{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="plan-features-list">
                      {plan.features.map((feat, i) => (
                        <li key={i}>
                          <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 1-Click Select Plan Button */}
                  <button
                    type="button"
                    onClick={() => onSelectPlan(selectedProvider, plan)}
                    className={`btn ${isPopular ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
                  >
                    <span>Choose Plan</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
