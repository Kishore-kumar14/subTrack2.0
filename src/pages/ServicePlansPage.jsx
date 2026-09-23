import React, { useState, useEffect } from 'react';
import { PROVIDER_CATALOG, CATEGORIES, PAYMENT_METHODS } from '../data/providerCatalog';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import SubscriptionIcon from '../components/common/SubscriptionIcon';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Calendar,
  DollarSign,
  Bell,
  CreditCard,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  Check
} from 'lucide-react';

export default function ServicePlansPage({
  provider: initialProvider = null,
  providerId = null,
  onBack,
  onSuccess
}) {
  const { addSubscription } = useSubscriptions();
  const { currency, formatAmount } = useAuth();

  // Find provider from catalog if provided by id
  const provider = initialProvider || (providerId ? PROVIDER_CATALOG.find(p => p.id === providerId) : null);
  const isCustom = !provider || providerId === 'custom';

  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'monthly' | 'yearly'
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Calculate default next renewal date
  const getDefaultDate = (cycle = 'monthly') => {
    const d = new Date();
    if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3);
    else if (cycle === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  // Form state
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    planName: '',
    category: provider?.category || 'Entertainment',
    cost: '',
    billingCycle: 'monthly',
    nextRenewalDate: getDefaultDate('monthly'),
    paymentMethod: 'UPI',
    isFreeTrial: false,
    trialEndDate: '',
    reminderDays: 3,
    usageFrequency: 'daily',
    providerId: provider?.id || '',
    brandColor: provider?.brandColor || '#2563eb',
    iconText: provider?.iconText || '★',
    logo: provider?.logo || null,
    notes: ''
  });

  // When provider changes, select the first popular/default plan
  useEffect(() => {
    if (provider && provider.plans && provider.plans.length > 0) {
      // Prefer popular or first plan
      const defaultPlan = provider.plans.find(p => p.badge?.toLowerCase().includes('popular')) || provider.plans[0];
      handleChoosePlan(defaultPlan);
    } else if (isCustom) {
      setFormData(prev => ({
        ...prev,
        providerId: '',
        name: '',
        planName: 'Pro Tier',
        category: 'Productivity',
        cost: '',
        billingCycle: 'monthly',
        nextRenewalDate: getDefaultDate('monthly'),
        paymentMethod: 'Credit Card',
        brandColor: '#2563eb',
        iconText: '★',
        logo: null,
        notes: ''
      }));
    }
  }, [providerId, provider]);

  const handleChoosePlan = (plan) => {
    setSelectedPlanId(plan.id);
    const selectedCost = currency === 'USD' ? plan.costUSD : plan.costINR;

    setFormData(prev => ({
      ...prev,
      providerId: provider?.id || prev.providerId,
      name: provider?.name || prev.name,
      planName: plan.name,
      category: provider?.category || prev.category,
      cost: selectedCost,
      billingCycle: plan.billingCycle,
      nextRenewalDate: getDefaultDate(plan.billingCycle),
      brandColor: provider?.brandColor || prev.brandColor,
      iconText: provider?.iconText || prev.iconText,
      logo: provider?.logo || prev.logo || null,
      notes: `${plan.name} (${plan.features.slice(0, 3).join(', ')})`
    }));
  };

  // Filter available plans for the provider
  const filteredPlans = (provider?.plans || []).filter(plan => {
    if (planFilter === 'monthly') return plan.billingCycle === 'monthly';
    if (planFilter === 'yearly') return plan.billingCycle === 'yearly';
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.cost === '' || Number(formData.cost) < 0) {
      alert('Please provide a valid subscription name and cost.');
      return;
    }

    addSubscription({
      ...formData,
      cost: Number(formData.cost)
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="service-plans-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Top Header & Breadcrumbs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button
            onClick={onBack}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Services</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer' }} onClick={onBack}>Add Subscription</span>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              {isCustom ? 'Custom Service Plans' : `${provider?.name} Plans`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>{isCustom ? 'Create Custom Subscription' : `${provider?.name} Subscription Plans`}</span>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                Step 2 of 2
              </span>
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              {isCustom
                ? 'Enter your custom subscription details and choose your billing cycle.'
                : `Select a plan for ${provider?.name}, customize renewal details, and save to your dashboard.`}
            </p>
          </div>
        </div>
      </div>

      {/* Provider Hero Banner */}
      {!isCustom && provider && (
        <div
          className="glass-panel"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, var(--bg-card) 100%)',
            border: '1.5px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <SubscriptionIcon subscription={provider} size={64} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{provider.name}</h2>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  {provider.category}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px' }}>
                {provider.description}
              </p>
            </div>
          </div>

          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <span>Visit Official Site</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}

      {/* Custom Provider Info Fields if in Custom Mode */}
      {isCustom && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Service Identification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label">Service / App Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Adobe Creative Cloud, Gym, Hostinger..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Brand Color Accent</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {formData.brandColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans Section (for Catalog Providers) */}
      {!isCustom && provider?.plans && provider.plans.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                1. Select an Available Plan
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Pick from authentic tiers and pricing. You can adjust details below.
              </p>
            </div>

            {/* Plan Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => setPlanFilter('all')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'all' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                All Plans ({provider.plans.length})
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter('monthly')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'monthly' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'monthly' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter('yearly')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: planFilter === 'yearly' ? 'var(--primary)' : 'transparent',
                  color: planFilter === 'yearly' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Annual Saver
              </button>
            </div>
          </div>

          {/* Grid of Plans */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredPlans.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const isFeatured = plan.badge && (plan.badge.toLowerCase().includes('popular') || plan.badge.toLowerCase().includes('best value'));
              const planCost = currency === 'USD' ? plan.costUSD : plan.costINR;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleChoosePlan(plan)}
                  className={`recharge-plan-card ${isSelected ? 'active' : ''} ${isFeatured ? 'featured' : ''}`}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: isSelected
                      ? 'linear-gradient(180deg, rgba(37, 99, 235, 0.18) 0%, var(--bg-card) 100%)'
                      : 'var(--bg-card)',
                    boxShadow: isSelected ? '0 0 24px var(--primary-glow)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {plan.badge && (
                    <div className="plan-badge-tag">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {plan.name}
                      </h3>
                      {isSelected && (
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--accent-emerald)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Check size={15} />
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
                      {plan.billingCycle} billing cycle
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {formatAmount(planCost)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                        /{plan.billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="plan-features-list" style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {plan.features.map((feat, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoosePlan(plan);
                    }}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ width: '100%', fontWeight: 700 }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={15} />
                        <span>Selected Plan</span>
                      </>
                    ) : (
                      <span>Choose {plan.name}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Finalization Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          className="glass-panel"
          style={{
            padding: '1.75rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>2. Billing & Schedule Details</span>
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Review renewal date, payment method, and proactive alert reminders.
              </p>
            </div>

            {formData.planName && (
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                Plan: {formData.planName}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Plan Tier Name */}
            <div>
              <label className="form-label">Plan / Tier Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Standard HD, Premium 4K"
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              />
            </div>

            {/* Recurring Cost */}
            <div>
              <label className="form-label">
                Cost ({currency}) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div>
              <label className="form-label">Billing Cycle</label>
              <select
                className="form-control"
                value={formData.billingCycle}
                onChange={(e) => {
                  const newCycle = e.target.value;
                  setFormData({
                    ...formData,
                    billingCycle: newCycle,
                    nextRenewalDate: getDefaultDate(newCycle)
                  });
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Next Renewal Date */}
            <div>
              <label className="form-label">Next Renewal Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.nextRenewalDate}
                onChange={(e) => setFormData({ ...formData, nextRenewalDate: e.target.value })}
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="form-label">Payment Method</label>
              <select
                className="form-control"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Reminder Alert Notice */}
            <div>
              <label className="form-label">Reminder Notification</label>
              <select
                className="form-control"
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
              >
                <option value={1}>1 day before renewal</option>
                <option value={2}>2 days before renewal</option>
                <option value={3}>3 days before renewal (Recommended)</option>
                <option value={5}>5 days before renewal</option>
                <option value={7}>7 days before renewal</option>
              </select>
            </div>
          </div>

          {/* Free Trial Toggle */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: formData.isFreeTrial ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-input)',
              border: formData.isFreeTrial ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={formData.isFreeTrial}
                onChange={(e) => setFormData({ ...formData, isFreeTrial: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.isFreeTrial ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  This subscription is currently on a Free Trial
                </span>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                  SubTrack will send you urgent expiration alerts before auto-charge occurs.
                </p>
              </div>
            </label>

            {formData.isFreeTrial && (
              <div style={{ marginTop: '1rem', maxWidth: '300px' }}>
                <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Trial Expiration Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.trialEndDate}
                  onChange={(e) => setFormData({ ...formData, trialEndDate: e.target.value })}
                  required={formData.isFreeTrial}
                />
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Notes & Tags (Optional)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Shared with roommates, student discount applied, work card..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn btn-secondary"
            style={{ fontWeight: 600, padding: '0.75rem 1.5rem' }}
          >
            Cancel / Back
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              fontWeight: 800,
              fontSize: '1rem',
              padding: '0.75rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 18px var(--primary-glow)'
            }}
          >
            <Check size={18} />
            <span>Confirm & Add Subscription</span>
          </button>
        </div>
      </form>
    </div>
  );
}
