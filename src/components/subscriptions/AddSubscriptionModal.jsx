import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import RechargePlanPicker from './RechargePlanPicker';
import { CATEGORIES, PAYMENT_METHODS } from '../../data/providerCatalog';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import SubscriptionIcon from '../common/SubscriptionIcon';
import { Sparkles, Edit3, Calendar, DollarSign, Bell, CreditCard, Layers, Tag } from 'lucide-react';

export default function AddSubscriptionModal({ isOpen, onClose, editingSubscription = null }) {
  const { addSubscription, updateSubscription } = useSubscriptions();
  const { currency, currencySymbol } = useAuth();

  const [activeTab, setActiveTab] = useState(editingSubscription ? 'custom' : 'popular');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    planName: '',
    category: 'Entertainment',
    cost: '',
    billingCycle: 'monthly',
    nextRenewalDate: '',
    paymentMethod: 'Credit Card',
    isFreeTrial: false,
    trialEndDate: '',
    reminderDays: 3,
    usageFrequency: 'daily',
    brandColor: '#6366f1',
    iconText: 'S',
    notes: ''
  });

  // Calculate default next renewal date (30 days from now)
  const getDefaultDate = (cycle = 'monthly') => {
    const d = new Date();
    if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3);
    else if (cycle === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  // Reset or populate form when opening or editing
  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name || '',
        planName: editingSubscription.planName || '',
        category: editingSubscription.category || 'Entertainment',
        cost: editingSubscription.cost || '',
        billingCycle: editingSubscription.billingCycle || 'monthly',
        nextRenewalDate: editingSubscription.nextRenewalDate || getDefaultDate('monthly'),
        paymentMethod: editingSubscription.paymentMethod || 'Credit Card',
        isFreeTrial: editingSubscription.isFreeTrial || false,
        trialEndDate: editingSubscription.trialEndDate || '',
        reminderDays: editingSubscription.reminderDays || 3,
        usageFrequency: editingSubscription.usageFrequency || 'daily',
        brandColor: editingSubscription.brandColor || '#6366f1',
        iconText: editingSubscription.iconText || 'S',
        notes: editingSubscription.notes || ''
      });
      setActiveTab('custom');
    } else {
      setFormData({
        name: '',
        planName: '',
        category: 'Entertainment',
        cost: '',
        billingCycle: 'monthly',
        nextRenewalDate: getDefaultDate('monthly'),
        paymentMethod: 'Credit Card',
        isFreeTrial: false,
        trialEndDate: '',
        reminderDays: 3,
        usageFrequency: 'daily',
        brandColor: '#6366f1',
        iconText: '★',
        notes: ''
      });
      setActiveTab('popular');
    }
  }, [editingSubscription, isOpen]);


  // When user clicks a recharge plan from the 20+ catalog
  const handleSelectProviderPlan = (provider, plan) => {
    // If currency is USD, use plan.costUSD, else costINR
    const selectedCost = currency === 'USD' ? plan.costUSD : plan.costINR;

    setFormData({
      name: provider.name,
      planName: plan.name,
      category: provider.category,
      cost: selectedCost,
      billingCycle: plan.billingCycle,
      nextRenewalDate: getDefaultDate(plan.billingCycle),
      paymentMethod: 'UPI',
      isFreeTrial: false,
      trialEndDate: '',
      reminderDays: 3,
      brandColor: provider.brandColor,
      iconText: provider.iconText,
      notes: `${plan.name} (${plan.features.slice(0, 2).join(', ')})`
    });

    // Switch to custom tab so user can review and hit Save
    setActiveTab('custom');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cost) return;

    if (editingSubscription) {
      updateSubscription(editingSubscription.id, {
        ...formData,
        cost: Number(formData.cost)
      });
    } else {
      addSubscription({
        ...formData,
        cost: Number(formData.cost)
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
      maxWidth="840px"
    >
      {/* Tabs */}
      {!editingSubscription && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: 'var(--bg-input)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('popular')}
            className="btn"
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'popular' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'popular' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <Sparkles size={16} />
            <span>Popular Plans (Jio/Airtel Style Recharge)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className="btn"
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'custom' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'custom' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <Edit3 size={16} />
            <span>Custom / Manual Subscription</span>
          </button>
        </div>
      )}

      {/* Tab 1: Popular Recharge Style Plan Picker */}
      {activeTab === 'popular' && (
        <RechargePlanPicker onSelectPlan={handleSelectProviderPlan} />
      )}

      {/* Tab 2: Custom / Review Details Form */}
      {activeTab === 'custom' && (
        <form onSubmit={handleSubmit}>
          {formData.name && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                marginBottom: '1.25rem'
              }}
            >
              <SubscriptionIcon subscription={formData} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {formData.name} {formData.planName ? `• ${formData.planName}` : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Selected plan ready. Tweak details below or click Save.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Service Name */}
            <div className="form-group">
              <label className="form-label">Subscription / Service Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Netflix, Cult.fit, Spotify..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Plan Tier */}
            <div className="form-group">
              <label className="form-label">Plan Name / Tier</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Premium 4K, Pro Annual, Duo"
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="form-group">
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

            {/* Cost */}
            <div className="form-group">
              <label className="form-label">Cost ({currencySymbol}) *</label>
              <input
                type="number"
                step="any"
                required
                min="0"
                className="form-control"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>

            {/* Billing Cycle */}
            <div className="form-group">
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
                <option value="yearly">Yearly (Annual)</option>
                <option value="quarterly">Quarterly (3 Months)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Next Renewal Date */}
            <div className="form-group">
              <label className="form-label">Next Renewal Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.nextRenewalDate}
                onChange={(e) => setFormData({ ...formData, nextRenewalDate: e.target.value })}
              />
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-control"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Reminder Timing */}
            <div className="form-group">
              <label className="form-label">Alert Reminder</label>
              <select
                className="form-control"
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
              >
                <option value={1}>1 day before renewal</option>
                <option value={2}>2 days before renewal</option>
                <option value={3}>3 days before renewal (Recommended)</option>
                <option value={7}>7 days before renewal</option>
              </select>
            </div>

            {/* Usage Frequency (for Audit & Wasted Spend tracking) */}
            <div className="form-group">
              <label className="form-label">Usage Frequency</label>
              <select
                className="form-control"
                value={formData.usageFrequency}
                onChange={(e) => setFormData({ ...formData, usageFrequency: e.target.value })}
              >
                <option value="daily">Daily Active Use</option>
                <option value="weekly">Weekly / Regular</option>
                <option value="rarely">Rarely Used (Flag in Audit)</option>
                <option value="forgotten">Forgotten / Inactive</option>
              </select>
            </div>
          </div>


          {/* Free Trial Toggle */}
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Free Trial Subscription</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Receive urgent notification before trial expires so your card is not charged.
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.isFreeTrial}
                  onChange={(e) => setFormData({ ...formData, isFreeTrial: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {formData.isFreeTrial && (
              <div className="form-group" style={{ margin: 0, animation: 'fadeIn 0.2s ease' }}>
                <label className="form-label">Free Trial Expiration Date *</label>
                <input
                  type="date"
                  required={formData.isFreeTrial}
                  className="form-control"
                  value={formData.trialEndDate}
                  onChange={(e) => setFormData({ ...formData, trialEndDate: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Notes & Account Details</label>
            <textarea
              rows={2}
              className="form-control"
              placeholder="e.g. Login email, registered phone number, family members shared..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            {!editingSubscription && (
              <button
                type="button"
                onClick={() => setActiveTab('popular')}
                className="btn btn-ghost"
              >
                Back to Recharge Catalog
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingSubscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
