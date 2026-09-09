import React, { useMemo, useState } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import SubscriptionIcon from '../components/common/SubscriptionIcon';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  CreditCard,
  AlertTriangle,
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
  BarChart2
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
    cancelSubscription
  } = useSubscriptions();

  const { user, formatAmount, currency } = useAuth();
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

  // Active Subscriptions for print report and overview
  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
  }, [subscriptions]);

  return (
    <div className="analytics-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
            Subscription Spending & Analytics
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Visual cost breakdowns and 30-day forecast schedule
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            <Printer size={16} />
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
                      <SubscriptionIcon subscription={sub} size={34} />
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

      {/* Dedicated Print Report View: Active Subscriptions List & Category Analytics */}
      <div id="subtrack-print-report">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img src="/logo.svg" alt="SubTrack Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                SubTrack Financial & Subscription Report
              </h1>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>
                Account: {user?.name || 'Member'} ({user?.email || 'N/A'}) • Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Spending Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
              Active Subscriptions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {activeSubscriptions.length}
            </div>
          </div>
          <div style={{ padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
              Total Monthly Outflow
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {formatAmount(monthlySpend)}
            </div>
          </div>
          <div style={{ padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
              Projected Annual Spend
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {formatAmount(yearlySpend)}
            </div>
          </div>
        </div>

        {/* Section A: Active Subscriptions List Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '0.4rem' }}>
            1. Active Subscriptions List ({activeSubscriptions.length} Tracked Services)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '9px 10px', width: '35px', color: '#1e293b' }}>#</th>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Subscription Name / Plan</th>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Category</th>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Start Date</th>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Renewal Date</th>
                <th style={{ padding: '9px 10px', textAlign: 'right', color: '#1e293b' }}>Price</th>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {activeSubscriptions.map((sub, idx) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                    {sub.name} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.75rem' }}>({sub.planName || 'Standard'})</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{sub.category}</td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{sub.firstBillingDate || '—'}</td>
                  <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 600 }}>{sub.nextRenewalDate || '—'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatAmount(sub.cost)} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748b' }}>/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>{sub.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section B: Category-Wise Total Analytics Table */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '0.4rem' }}>
            2. Category-Wise Spending Analytics
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '9px 10px', color: '#1e293b' }}>Category</th>
                <th style={{ padding: '9px 10px', textAlign: 'center', color: '#1e293b' }}>Active Services</th>
                <th style={{ padding: '9px 10px', textAlign: 'right', color: '#1e293b' }}>Monthly Spend</th>
                <th style={{ padding: '9px 10px', textAlign: 'right', color: '#1e293b' }}>Projected Annual Spend</th>
                <th style={{ padding: '9px 10px', textAlign: 'right', color: '#1e293b' }}>% of Total Outflow</th>
              </tr>
            </thead>
            <tbody>
              {categoryBreakdown.map((cat, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{cat.category}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155' }}>{cat.count}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatAmount(cat.totalCost)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>{formatAmount(cat.totalCost * 12)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{cat.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
