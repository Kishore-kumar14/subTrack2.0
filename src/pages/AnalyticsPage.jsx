import React, { useMemo, useState } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldAlert,
  Ban,
  RefreshCw,
  HelpCircle,
  BarChart2,
  Trash2,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// Curated Category Palette
const CATEGORY_COLORS = {
  'Entertainment': '#ec4899',
  'Music & Audio': '#10b981',
  'AI & Dev': '#6366f1',
  'Productivity': '#06b6d4',
  'Gaming': '#a855f7',
  'Utilities & Telecom': '#f59e0b',
  'Fitness & Health': '#f43f5e',
  'Lifestyle': '#3b82f6',
  'Other': '#94a3b8'
};

const PALETTE = ['#6366f1', '#10b981', '#ec4899', '#06b6d4', '#f59e0b', '#a855f7', '#f43f5e', '#3b82f6'];

export default function AnalyticsPage() {
  const {
    subscriptions,
    monthlySpend,
    yearlySpend,
    activeCount,
    categoryBreakdown,
    nextBillDue,
    getMonthlyEquivalent,
    renewSubscription,
    cancelSubscription,
    tagUsageFrequency
  } = useSubscriptions();

  const { formatAmount, currency } = useAuth();
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(null);

  // =========================================================================
  // 1. TOP-LEVEL METRICS
  // =========================================================================
  // Monthly Total
  // Annual Run-Rate = (monthlySpend * 12)
  // Active Subscriptions count
  // Next Bill Due = nextBillDue

  // =========================================================================
  // 2. CATEGORY DOUGHNUT DATA
  // =========================================================================
  const pieChartData = useMemo(() => {
    return categoryBreakdown.map((cat, idx) => ({
      name: cat.category,
      value: cat.totalCost,
      count: cat.count,
      percentage: cat.percentage,
      color: CATEGORY_COLORS[cat.category] || PALETTE[idx % PALETTE.length]
    }));
  }, [categoryBreakdown]);

  // =========================================================================
  // 3. UPCOMING 30-DAY FORECAST (TIMELINE & BAR CHART)
  // =========================================================================
  const { forecastList, forecastBarData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = subscriptions
      .filter(s => s.status !== 'cancelled' && s.status !== 'paused' && (s.nextRenewalDate || s.trialEndDate))
      .map(s => {
        const renewal = new Date(s.isFreeTrial && s.trialEndDate ? s.trialEndDate : s.nextRenewalDate);
        renewal.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
        return { ...s, daysLeft, targetDate: renewal };
      })
      .filter(s => s.daysLeft >= 0 && s.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // Group forecast by date for the bar chart
    const dateMap = {};
    list.forEach(item => {
      const dateKey = item.targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          amount: 0,
          isUrgent: item.daysLeft <= 7,
          services: []
        };
      }
      dateMap[dateKey].amount += Number(item.cost || 0);
      dateMap[dateKey].services.push(item.name);
    });

    const barData = Object.values(dateMap);

    return { forecastList: list, forecastBarData: barData };
  }, [subscriptions]);

  // =========================================================================
  // 4. THE "AUDIT" OR "WASTED SPEND" INTELLIGENCE
  // =========================================================================
  // A. Overlapping services detector
  const overlappingInsights = useMemo(() => {
    const overlaps = [];

    // Music Overlap
    const musicSubs = subscriptions.filter(s => s.status === 'active' && (s.category === 'Music & Audio' || s.name.toLowerCase().includes('spotify') || s.name.toLowerCase().includes('apple music') || s.name.toLowerCase().includes('yt music')));
    if (musicSubs.length > 1) {
      const secondaryCost = musicSubs.slice(1).reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);
      overlaps.push({
        id: 'overlap-music',
        category: 'Music & Audio',
        title: 'Overlapping Music Streaming Platforms',
        services: musicSubs.map(s => s.name),
        explanation: `You are paying for multiple music streaming services (${musicSubs.map(s => s.name).join(' & ')}). Consolidating into one service could save you ${formatAmount(secondaryCost * 12)} per year.`,
        potentialSavings: secondaryCost * 12
      });
    }

    // Video Streaming Overlap (3+ video platforms)
    const videoSubs = subscriptions.filter(s => s.status === 'active' && s.category === 'Entertainment' && !s.name.toLowerCase().includes('game') && !s.name.toLowerCase().includes('playstation'));
    if (videoSubs.length >= 3) {
      const estWasted = getMonthlyEquivalent(videoSubs[videoSubs.length - 1]);
      overlaps.push({
        id: 'overlap-video',
        category: 'Entertainment',
        title: 'High Video Streaming Redundancy',
        services: videoSubs.map(s => s.name),
        explanation: `You have ${videoSubs.length} video streaming services active simultaneously (${videoSubs.map(s => s.name).join(', ')}). Cycling through platforms can save approx. ${formatAmount(estWasted * 12)} annually.`,
        potentialSavings: estWasted * 12
      });
    }

    // Cloud Storage Overlap
    const cloudSubs = subscriptions.filter(s => s.status === 'active' && (s.name.toLowerCase().includes('google one') || s.name.toLowerCase().includes('dropbox') || s.name.toLowerCase().includes('icloud') || s.name.toLowerCase().includes('onedrive')));
    if (cloudSubs.length > 1) {
      const lowerCloud = cloudSubs.slice(1).reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);
      overlaps.push({
        id: 'overlap-cloud',
        category: 'Cloud Storage',
        title: 'Duplicate Cloud Storage Subscriptions',
        services: cloudSubs.map(s => s.name),
        explanation: `Multiple cloud backup subscriptions detected (${cloudSubs.map(s => s.name).join(' and ')}). Unifying under one provider could eliminate ${formatAmount(lowerCloud * 12)} in yearly fees.`,
        potentialSavings: lowerCloud * 12
      });
    }

    return overlaps;
  }, [subscriptions, getMonthlyEquivalent, formatAmount]);

  // B. Subscriptions tagged as "rarely used" or forgotten
  const rarelyUsedSubscriptions = useMemo(() => {
    return subscriptions.filter(s =>
      s.status !== 'cancelled' && (s.usageFrequency === 'rarely' || s.usageFrequency === 'forgotten')
    );
  }, [subscriptions]);

  // Total potential wasted spend identified
  const totalWastedAnnual = useMemo(() => {
    let wasted = 0;
    rarelyUsedSubscriptions.forEach(s => {
      wasted += getMonthlyEquivalent(s) * 12;
    });
    overlappingInsights.forEach(o => {
      wasted += o.potentialSavings;
    });
    return wasted;
  }, [rarelyUsedSubscriptions, overlappingInsights, getMonthlyEquivalent]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Service Name', 'Plan', 'Category', 'Cost', 'Billing Cycle', 'Next Renewal', 'Payment Method', 'Usage Tag', 'Status'];
    const rows = subscriptions.map(s => [
      `"${s.name}"`,
      `"${s.planName || ''}"`,
      `"${s.category}"`,
      s.cost,
      `"${s.billingCycle}"`,
      `"${s.nextRenewalDate || ''}"`,
      `"${s.paymentMethod}"`,
      `"${s.usageFrequency || 'regular'}"`,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subtrack_analytics_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            Subscription Spending & Audit Analytics
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Visual cost breakdowns, 30-day forecast timeline, and intelligence audit to eliminate wasted spend
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={15} />
            <span>Export CSV Audit</span>
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: TOP-LEVEL METRIC CARDS (THE QUICK GLANCE)
         ========================================================================= */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          1. The Quick Glance Overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Total Monthly Spend */}
          <StatCard
            title="Total Monthly Spend"
            value={formatAmount(monthlySpend)}
            subtitle="Normalized sum of active recurring bills"
            badgeText="Monthly Total"
            badgeType="primary"
            icon={CreditCard}
            accentColor="var(--primary)"
          />

          {/* Card 2: Total Annual Run-Rate */}
          <StatCard
            title="Total Annual Run-Rate"
            value={formatAmount(yearlySpend)}
            subtitle="Monthly Total × 12 + Annual Subscriptions"
            badgeText="Projected Year"
            badgeType="emerald"
            icon={TrendingUp}
            accentColor="var(--accent-emerald)"
          />

          {/* Card 3: Active Subscriptions */}
          <StatCard
            title="Active Subscriptions"
            value={activeCount}
            subtitle={`${subscriptions.filter(s => s.status === 'trial').length} free trial • ${subscriptions.length - activeCount} paused/cancelled`}
            badgeText="Paying Services"
            badgeType="cyan"
            icon={Layers}
            accentColor="var(--accent-cyan)"
          />

          {/* Card 4: Next Bill Due */}
          <div
            className="glass-panel glass-panel-hover"
            style={{
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              borderLeft: nextBillDue && nextBillDue.daysLeft <= 3 ? '4px solid var(--accent-rose)' : '4px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Next Bill Due
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: nextBillDue && nextBillDue.daysLeft <= 3 ? 'rgba(244, 63, 94, 0.18)' : 'rgba(99, 102, 241, 0.18)',
                  color: nextBillDue && nextBillDue.daysLeft <= 3 ? 'var(--accent-rose)' : 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={20} />
              </div>
            </div>

            {nextBillDue ? (
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {nextBillDue.name} • {formatAmount(nextBillDue.cost)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    className={`badge ${nextBillDue.daysLeft <= 3 ? 'badge-rose' : 'badge-emerald'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {nextBillDue.daysLeft === 0 ? 'Due Today' : nextBillDue.daysLeft === 1 ? 'Due Tomorrow' : `Due in ${nextBillDue.daysLeft} days`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    on {new Date(nextBillDue.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                No upcoming bills scheduled
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CATEGORY BREAKDOWN (THE "WHERE" - PIE/DOUGHNUT CHART)
         ========================================================================= */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          2. Category Breakdown (The "Where")
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <PieChartIcon size={20} style={{ color: 'var(--primary-light)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Spending Distribution Across Sectors
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Monthly Equivalent: <strong style={{ color: 'var(--text-primary)' }}>{formatAmount(monthlySpend)}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            {/* Interactive Doughnut Chart */}
            <div style={{ height: '280px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="glass-panel"
                            style={{
                              padding: '0.6rem 0.85rem',
                              fontSize: '0.8rem',
                              border: '1px solid var(--border-medium)',
                              background: 'rgba(15, 23, 42, 0.95)'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: data.color }}>{data.name}</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                              {formatAmount(data.value)}/mo
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              {data.percentage}% of total spend • {data.count} service{data.count > 1 ? 's' : ''}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={pieChartData}
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ outline: 'none', cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Doughnut Label */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Outflow
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {formatAmount(monthlySpend)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>/ month</div>
              </div>
            </div>

            {/* Category Breakdown Legend & List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pieChartData.map((cat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-badge)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'transform var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        backgroundColor: cat.color,
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{cat.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {cat.count} service{cat.count > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                      {formatAmount(cat.value)}/mo
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {cat.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: UPCOMING RENEWALS TIMELINE (THE "WHEN" - BAR CHART & LIST)
         ========================================================================= */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          3. Upcoming Renewals Timeline (The "When" - 30-Day Forecast)
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart2 size={20} style={{ color: 'var(--accent-amber)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                30-Day Cash Outflow Forecast
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-rose)' }} />
                <span>Next 7 Days (Critical)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--primary)' }} />
                <span>Later (8-30 Days)</span>
              </span>
            </div>
          </div>

          {/* Bar Chart: Daily Outflow Forecast */}
          {forecastBarData.length > 0 ? (
            <div style={{ height: '220px', marginBottom: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div
                            className="glass-panel"
                            style={{
                              padding: '0.5rem 0.8rem',
                              fontSize: '0.8rem',
                              border: '1px solid var(--border-medium)',
                              background: 'rgba(15, 23, 42, 0.95)'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: d.isUrgent ? 'var(--accent-rose)' : 'var(--primary-light)' }}>
                              {d.date} {d.isUrgent ? '• Due in <= 7 Days' : ''}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{formatAmount(d.amount)}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {d.services.join(', ')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[6, 6, 0, 0]}
                  >
                    {forecastBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isUrgent ? 'var(--accent-rose)' : 'var(--primary)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              No bills due in the next 30 days.
            </div>
          )}

          {/* Chronological Forecast List with <= 7 Days Highlighted in RED */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
              Chronological 30-Day Renewal Schedule
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {forecastList.map(sub => {
                const isWithin7Days = sub.daysLeft <= 7;
                return (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isWithin7Days ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-badge)',
                      border: isWithin7Days ? '1.5px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-subtle)',
                      borderLeft: isWithin7Days ? '4px solid var(--accent-rose)' : `4px solid ${sub.brandColor || 'var(--primary)'}`,
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: sub.brandColor || 'var(--primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      >
                        {sub.iconText || 'S'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                          {sub.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({sub.planName})</span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          via {sub.paymentMethod} • {sub.category}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isWithin7Days ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                          {sub.targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <span
                          className={`badge ${isWithin7Days ? 'badge-rose' : 'badge-primary'}`}
                          style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}
                        >
                          {sub.daysLeft === 0 ? 'DUE TODAY' : sub.daysLeft === 1 ? 'DUE TOMORROW' : `DUE IN ${sub.daysLeft} DAYS`}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                          {formatAmount(sub.cost)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {sub.billingCycle}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => renewSubscription(sub.id)}
                        className="btn btn-sm btn-success"
                        style={{ fontSize: '0.75rem' }}
                        title="Mark Renewed"
                      >
                        <RefreshCw size={13} />
                        <span>Renew</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: THE "AUDIT" OR "WASTED SPEND" SECTION
         ========================================================================= */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          4. The "Audit" & Wasted Spend Intelligence
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}
        >
          {/* Header & Total Wasted Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Personal Finance Subscription Audit
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Identifies redundant overlapping tools and subscriptions flagged as rarely used.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                Potential Annual Wasted Outflow
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)' }}>
                {formatAmount(totalWastedAnnual)}
              </div>
            </div>
          </div>

          {/* Sub-section A: Overlapping Services */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Overlapping & Duplicate Subscriptions</span>
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                {overlappingInsights.length} Detected
              </span>
            </h4>

            {overlappingInsights.length === 0 ? (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-badge)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ No overlapping service categories detected. Your subscriptions are well diversified.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {overlappingInsights.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</span>
                        <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                          Save {formatAmount(item.potentialSavings)}/yr
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                        {item.explanation}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {item.services.map((sName, sIdx) => (
                        <span key={sIdx} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {sName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section B: Rarely Used or Forgotten Subscriptions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Forgotten & "Rarely Used" Subscriptions</span>
                <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                  {rarelyUsedSubscriptions.length} Flagged
                </span>
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target for cancellation to reduce recurring waste
              </span>
            </div>

            {rarelyUsedSubscriptions.length === 0 ? (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-badge)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ No subscriptions are currently tagged as rarely used. You can tag any service below or when adding a subscription.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rarelyUsedSubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderLeft: '4px solid var(--accent-rose)',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: sub.brandColor || 'var(--primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800
                        }}
                      >
                        {sub.iconText || 'S'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</span>
                          <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                            Rarely Used
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {sub.notes || 'Tagged as rarely opened or underutilized'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
                          {formatAmount(sub.cost)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Cost: {formatAmount(getMonthlyEquivalent(sub) * 12)}/yr
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => cancelSubscription(sub.id)}
                          className="btn btn-sm btn-danger"
                          style={{ fontSize: '0.75rem' }}
                          title="Cancel subscription to eliminate waste"
                        >
                          <Ban size={13} />
                          <span>Cancel Subscription</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => tagUsageFrequency(sub.id, 'daily')}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem' }}
                          title="Mark as active daily use"
                        >
                          <Check size={13} />
                          <span>Keep (Regular Use)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Tagging Selector for All Active Subscriptions */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                Audit Your Services: Tag Usage Frequency
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {subscriptions.filter(s => s.status === 'active').map(sub => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-badge)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.775rem'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{sub.name}</span>
                    <select
                      value={sub.usageFrequency || 'daily'}
                      onChange={(e) => tagUsageFrequency(sub.id, e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: sub.usageFrequency === 'rarely' ? 'var(--accent-rose)' : 'var(--primary-light)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="daily" style={{ background: '#0f172a' }}>Daily</option>
                      <option value="weekly" style={{ background: '#0f172a' }}>Weekly</option>
                      <option value="rarely" style={{ background: '#0f172a' }}>Rarely Used (Flag)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
