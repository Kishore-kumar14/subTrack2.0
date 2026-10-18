import React, { useState, useMemo, useEffect } from 'react';
import { PROVIDER_CATALOG, CATEGORIES } from '../data/providerCatalog';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SubscriptionIcon from '../components/common/SubscriptionIcon';
import {
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  SlidersHorizontal,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Database
} from 'lucide-react';

export default function AddSubscriptionPage({ onSelectProvider, onCustomSubscription, onBack }) {
  const { currency, formatAmount } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catalogProviders, setCatalogProviders] = useState(PROVIDER_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isFromDatabase, setIsFromDatabase] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setIsCatalogLoading(true);
      try {
        const liveCatalog = await api.getCatalog();
        if (isMounted && Array.isArray(liveCatalog) && liveCatalog.length > 0) {
          const normalized = liveCatalog.map((p) => ({
            ...p,
            id: p.providerId || p.id
          }));
          setCatalogProviders(normalized);
          setIsFromDatabase(true);
        }
      } catch (err) {
        console.info('Backend catalog fallback engaged:', err.message);
      } finally {
        if (isMounted) setIsCatalogLoading(false);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter providers by search and category
  const filteredProviders = useMemo(() => {
    return catalogProviders.filter(provider => {
      const matchesCategory = selectedCategory === 'All' || provider.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        provider.name.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query) ||
        (provider.description && provider.description.toLowerCase().includes(query)) ||
        (provider.plans && provider.plans.some(p => p.name.toLowerCase().includes(query)));
      return matchesCategory && matchesSearch;
    });
  }, [catalogProviders, searchQuery, selectedCategory]);

  // Compute lowest starting cost for a provider
  const getStartingPrice = (provider) => {
    if (!provider.plans || provider.plans.length === 0) return null;
    const monthlyPlans = provider.plans.filter(p => p.billingCycle === 'monthly');
    const pool = monthlyPlans.length > 0 ? monthlyPlans : provider.plans;
    const minPlan = pool.reduce((prev, curr) => {
      const prevCost = currency === 'USD' ? prev.costUSD : prev.costINR;
      const currCost = currency === 'USD' ? curr.costUSD : curr.costINR;
      return currCost < prevCost ? curr : prev;
    }, pool[0]);

    const cost = currency === 'USD' ? minPlan.costUSD : minPlan.costINR;
    return {
      cost,
      cycle: minPlan.billingCycle === 'yearly' ? 'yr' : 'mo'
    };
  };

  return (
    <div className="add-subscription-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header & Breadcrumb */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button
            onClick={onBack}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Subscriptions</span>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Add Subscription</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Add New Subscription</span>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                Step 1 of 2
              </span>
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '640px' }}>
              Select an application to view official recharge and recurring plans, or configure a custom unlisted subscription.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{
                background: isFromDatabase ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                color: isFromDatabase ? 'var(--success)' : 'var(--primary-light)',
                border: `1px solid ${isFromDatabase ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem'
              }}>
                <Database size={12} />
                {isFromDatabase
                  ? `Central Catalog • ${catalogProviders.length} Services Verified in Atlas`
                  : `Verified Catalog • ${catalogProviders.length} Services`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Standard consumer plans & billing intervals
              </span>
            </div>
          </div>

          {/* Quick Custom Subscription Button */}
          <button
            onClick={onCustomSubscription}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              padding: '0.65rem 1.25rem'
            }}
          >
            <Plus size={18} />
            <span>Add Custom Service</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Search Input Bar */}
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '1.1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--primary-light)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{
              paddingLeft: '3.2rem',
              paddingRight: searchQuery ? '3rem' : '1.25rem',
              fontSize: '1rem',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-input)',
              border: '1.5px solid var(--border-subtle)'
            }}
            placeholder="Search Netflix, Spotify, ChatGPT, Amazon Prime, YouTube, Jio, Airtel, iCloud..."
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
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'none'
          }}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="btn btn-sm"
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '0.45rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  background: isSelected ? 'var(--gradient-primary)' : 'var(--bg-badge)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 2px 10px var(--primary-glow)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Results Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-0.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Available Applications ({filteredProviders.length})
        </div>
        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Click any application to view plans & pricing
        </div>
      </div>

      {/* Grid of Applications */}
      {filteredProviders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <Sparkles size={48} style={{ color: 'var(--primary-light)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No matching applications found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            We couldn't find a catalog match for "{searchQuery}". You can quickly add it as a custom subscription!
          </p>
          <button
            onClick={onCustomSubscription}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Create Custom Subscription</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Custom Subscription Card as first featured card */}
          <div
            onClick={onCustomSubscription}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--primary)',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, var(--bg-card) 100%)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35), 0 0 20px var(--primary-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 14px var(--primary-glow)'
                }}
              >
                <Plus size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
                Custom Service
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Not in the list? Enter any custom service, gym membership, domain, cloud host, or personal subscription.
              </p>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.85rem' }}>
              <span>Configure Manually</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Catalog Provider Cards */}
          {filteredProviders.map(provider => {
            const start = getStartingPrice(provider);
            const planCount = provider.plans?.length || 0;

            return (
              <div
                key={provider.id}
                onClick={() => onSelectProvider(provider)}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-base)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.4), 0 0 20px var(--primary-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  {/* Top Bar with Icon and Category */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <SubscriptionIcon subscription={provider} size={48} />
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {provider.category.split(' ')[0]}
                    </span>
                  </div>

                  {/* Name and Description */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
                    {provider.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      margin: '0 0 1rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {provider.description}
                  </p>
                </div>

                {/* Footer with Starting Price & Plan Count */}
                <div
                  style={{
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {start ? (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Starts at
                        </span>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {formatAmount(start.cost)}
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            /{start.cycle}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Custom pricing</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.825rem' }}>
                    <span>{planCount} Plans</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
