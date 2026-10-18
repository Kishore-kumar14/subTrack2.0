import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import SubscriptionIcon from '../common/SubscriptionIcon';
import {
  parseLocalDate,
  formatDateKey,
  formatFriendlyDate,
  diffDays,
  getSubscriptionBillingPeriod,
  getRenewalTimelineStatus,
  generateDateRange,
  calculateTimelinePositions,
  getOverlappingRenewals
} from '../../utils/timelineUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  RotateCcw,
  Plus,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './RenewalTimeline.css';

export default function RenewalTimeline({
  onEditSubscription,
  onOpenAddModal,
  compact = false
}) {
  const { subscriptions } = useSubscriptions();
  const { formatAmount, currency, currencySymbol } = useAuth();

  // Date range presets: 7, 30, 90 days
  const [rangeDays, setRangeDays] = useState(30);

  // Offset in days from today (0 = starting from today)
  const [dayOffset, setDayOffset] = useState(0);

  // Status filter state ('all', 'active', 'approaching', 'overdue')
  const [statusFilter, setStatusFilter] = useState('all');

  // Interactive Hover Tooltip State
  const [tooltipData, setTooltipData] = useState(null);
  const containerRef = useRef(null);

  // Today reference normalized to 00:00:00
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Timeline window start date
  const rangeStartDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, dayOffset]);

  // Timeline window end date
  const rangeEndDate = useMemo(() => {
    const d = new Date(rangeStartDate);
    d.setDate(d.getDate() + rangeDays);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [rangeStartDate, rangeDays]);

  // Date columns array
  const dateColumns = useMemo(() => {
    return generateDateRange(rangeStartDate, rangeDays);
  }, [rangeStartDate, rangeDays]);

  // Overlapping renewals across the visible window
  const overlappingRenewals = useMemo(() => {
    return getOverlappingRenewals(subscriptions, rangeStartDate, rangeEndDate);
  }, [subscriptions, rangeStartDate, rangeEndDate]);

  // Map of overlapping dates for quick lookup
  const overlapDateMap = useMemo(() => {
    const map = {};
    overlappingRenewals.forEach(item => {
      map[item.dateKey] = item;
    });
    return map;
  }, [overlappingRenewals]);

  // Processed subscriptions with computed timeline metrics
  const processedSubscriptions = useMemo(() => {
    return subscriptions
      .map(sub => {
        const statusInfo = getRenewalTimelineStatus(sub, today);
        const periodInfo = getSubscriptionBillingPeriod(sub);

        let positions = {
          barLeft: 0,
          barWidth: 0,
          markerLeft: null,
          isBarVisible: false,
          isMarkerVisible: false
        };

        if (periodInfo.hasValidDates && periodInfo.startDate && periodInfo.endDate) {
          positions = calculateTimelinePositions(
            periodInfo.startDate,
            periodInfo.endDate,
            rangeStartDate,
            rangeDays
          );
        }

        return {
          ...sub,
          statusInfo,
          periodInfo,
          positions
        };
      })
      .filter(item => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return item.statusInfo.statusKey === 'active';
        if (statusFilter === 'approaching') return item.statusInfo.isApproaching;
        if (statusFilter === 'overdue') return item.statusInfo.isOverdue;
        return true;
      })
      .sort((a, b) => {
        // Sort: overdue first, then approaching, then active, then cancelled/paused
        const getPriority = (item) => {
          if (item.statusInfo.isOverdue) return 0;
          if (item.statusInfo.isApproaching) return 1;
          if (item.status === 'cancelled') return 4;
          if (item.status === 'paused') return 3;
          return 2;
        };

        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;

        // Then by renewal date
        const dateA = a.periodInfo.endDate ? a.periodInfo.endDate.getTime() : 9999999999999;
        const dateB = b.periodInfo.endDate ? b.periodInfo.endDate.getTime() : 9999999999999;
        return dateA - dateB;
      });
  }, [subscriptions, today, rangeStartDate, rangeDays, statusFilter]);

  // Position of vertical "Today" indicator
  const todayPositionPercent = useMemo(() => {
    const rangeStartMs = rangeStartDate.getTime();
    const rangeDurationMs = rangeDays * 24 * 60 * 60 * 1000;
    const todayMs = today.getTime();

    if (todayMs >= rangeStartMs && todayMs <= rangeStartMs + rangeDurationMs) {
      return ((todayMs - rangeStartMs) / rangeDurationMs) * 100;
    }
    return null;
  }, [today, rangeStartDate, rangeDays]);

  // Navigation handlers
  const handleShiftRange = (step) => {
    // Shift by half range or full range
    const shiftBy = rangeDays === 7 ? 7 : rangeDays === 30 ? 15 : 30;
    setDayOffset(prev => prev + step * shiftBy);
  };

  const handleResetToToday = () => {
    setDayOffset(0);
  };

  // Tooltip interaction handlers
  const handleMouseEnterBar = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top;

    // Boundary check so tooltip stays on screen
    const tooltipWidth = 290;
    let x = targetX - tooltipWidth / 2;
    if (x < 16) x = 16;
    if (x + tooltipWidth > window.innerWidth - 16) {
      x = window.innerWidth - tooltipWidth - 16;
    }

    setTooltipData({
      subscription: item,
      x,
      y: Math.max(10, targetY - 180)
    });
  };

  const handleMouseLeaveBar = () => {
    setTooltipData(null);
  };

  const handleRowClick = (sub) => {
    if (onEditSubscription) {
      onEditSubscription(sub);
    }
  };

  // Format currency summary string for overlapping renewals without incorrectly combining INR & USD
  const formatOverlapCurrencySummary = (currencyTotals) => {
    const parts = [];
    if (currencyTotals.INR > 0) {
      parts.push(`₹${currencyTotals.INR.toLocaleString('en-IN')}`);
    }
    if (currencyTotals.USD > 0) {
      parts.push(`$${currencyTotals.USD.toFixed(2)}`);
    }
    if (parts.length === 0) {
      return '—';
    }
    return parts.join(' + ');
  };

  // Determine tick interval based on range
  const shouldShowAxisLabel = (idx) => {
    if (rangeDays === 7) return true;
    if (rangeDays === 30) return idx % 3 === 0 || idx === rangeDays - 1;
    // 90 days: show every 7 days
    return idx % 7 === 0 || idx === rangeDays - 1;
  };

  return (
    <section
      className="renewal-timeline-card animate-fade-in"
      ref={containerRef}
      aria-label="Subscription Renewal Timeline"
    >
      {/* 1. Header with Title, Subtitle, Range Controls & Navigation */}
      <div className="timeline-header">
        <div className="timeline-title-area">
          <h2>
            <CalendarIcon size={22} style={{ color: 'var(--primary-light)' }} />
            <span>Subscription Renewal Timeline</span>
            <span className="timeline-title-badge">Gantt View</span>
          </h2>
          <p className="timeline-subtitle">
            Visualize your upcoming subscription billing periods, renewal deadlines, and overlapping payment dates across a horizontal calendar timeline.
          </p>
        </div>

        <div className="timeline-controls-bar">
          {/* Range Selector Switch */}
          <div className="timeline-range-switch" role="group" aria-label="Timeline range view">
            <button
              type="button"
              className={`range-btn ${rangeDays === 7 ? 'active' : ''}`}
              onClick={() => { setRangeDays(7); setDayOffset(0); }}
            >
              Next 7 Days
            </button>
            <button
              type="button"
              className={`range-btn ${rangeDays === 30 ? 'active' : ''}`}
              onClick={() => { setRangeDays(30); setDayOffset(0); }}
            >
              Next 30 Days
            </button>
            <button
              type="button"
              className={`range-btn ${rangeDays === 90 ? 'active' : ''}`}
              onClick={() => { setRangeDays(90); setDayOffset(0); }}
            >
              Next 90 Days
            </button>
          </div>

          {/* Navigation Pager */}
          <div className="timeline-nav-pager">
            <button
              type="button"
              className="pager-btn"
              onClick={() => handleShiftRange(-1)}
              title="Previous period"
              aria-label="Previous period"
            >
              <ChevronLeft size={16} />
            </button>

            {dayOffset !== 0 && (
              <button
                type="button"
                className="today-jump-btn"
                onClick={handleResetToToday}
                title="Jump back to current date"
              >
                <RotateCcw size={12} />
                <span>Today</span>
              </button>
            )}

            <button
              type="button"
              className="pager-btn"
              onClick={() => handleShiftRange(1)}
              title="Next period"
              aria-label="Next period"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overlapping Renewals Alert Strip (When multiple services renew on the same day) */}
      {overlappingRenewals.length > 0 && (
        <div className="timeline-overlap-banner">
          <div className="timeline-overlap-header">
            <div className="timeline-overlap-title">
              <AlertTriangle size={17} style={{ color: 'var(--accent-amber)' }} />
              <span>
                Overlapping Payment Dates Detected ({overlappingRenewals.length} date{overlappingRenewals.length > 1 ? 's' : ''})
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Multiple subscriptions share these renewal dates. Review your cash-flow peaks:
            </span>
          </div>

          <div className="timeline-overlap-pills">
            {overlappingRenewals.map(item => (
              <div key={item.dateKey} className="overlap-pill">
                <span className="overlap-date">
                  📅 {formatFriendlyDate(item.dateKey, false)}:
                </span>
                <span className="overlap-services">
                  {item.subscriptions.map(s => s.name).join(' & ')}
                </span>
                <span className="overlap-total">
                  Combined: {formatOverlapCurrencySummary(item.currencyTotals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Timeline Legend */}
      <div className="timeline-legend">
        <div className="legend-item" title="Verified cycle with recorded last billing date">
          <div className="legend-bar-swatch legend-bar-verified" />
          <span>Verified Billing Period</span>
        </div>

        <div className="legend-item" title="Estimated cycle based on subscription frequency">
          <div className="legend-bar-swatch legend-bar-estimated" />
          <span>Estimated Cycle</span>
        </div>

        <div className="legend-item">
          <div className="legend-marker-pin" />
          <span>Upcoming Renewal</span>
        </div>

        <div className="legend-item">
          <div className="legend-marker-approaching" />
          <span>Due Soon (≤ 3d)</span>
        </div>

        <div className="legend-item">
          <div className="legend-marker-overdue" />
          <span>Overdue</span>
        </div>

        <div className="legend-item">
          <div className="legend-today-line" />
          <span>Today's Date</span>
        </div>
      </div>

      {/* 4. Timeline Viewport (Horizontal Scrolling Gantt Area) */}
      {subscriptions.length === 0 ? (
        <div className="timeline-empty-state">
          <div className="empty-state-icon">
            <Layers size={28} />
          </div>
          <h3 className="empty-state-title">No Subscriptions Found</h3>
          <p className="empty-state-desc">
            You don't have any active subscriptions in your SubTrack account yet. Add your subscriptions to generate an interactive renewal schedule.
          </p>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <Plus size={15} />
              <span>Add Your First Subscription</span>
            </button>
          )}
        </div>
      ) : (
        <div className="timeline-viewport">
          <div className="timeline-canvas">
            {/* Top Date Axis Header Row */}
            <div className="timeline-axis-row">
              <div className="timeline-label-col-header">
                <span>Subscription Service</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {processedSubscriptions.length} item{processedSubscriptions.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="timeline-axis-track">
                {dateColumns.map((dayDate, idx) => {
                  const dayLeft = (idx / rangeDays) * 100;
                  const dayKey = formatDateKey(dayDate);
                  const isToday = dayDate.getTime() === today.getTime();
                  const isOverlap = Boolean(overlapDateMap[dayKey]);
                  const showLabel = shouldShowAxisLabel(idx);

                  return (
                    <div
                      key={dayKey}
                      className={`axis-day-cell ${isToday ? 'is-today' : ''} ${isOverlap ? 'is-overlap' : ''}`}
                      style={{ left: `${dayLeft}%`, width: `${100 / rangeDays}%` }}
                    >
                      {showLabel && (
                        <>
                          <span className="axis-day-name">
                            {dayDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
                          </span>
                          <span className="axis-day-num">
                            {dayDate.getDate()}
                            {idx === 0 || dayDate.getDate() === 1 ? (
                              <span style={{ fontSize: '0.65rem', marginLeft: '2px', color: 'var(--text-muted)' }}>
                                {dayDate.toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            ) : null}
                          </span>
                        </>
                      )}
                      {isOverlap && (
                        <div
                          className="axis-overlap-dot"
                          title={`Overlapping renewals on ${formatFriendlyDate(dayKey, false)}`}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Today Marker in Axis Header */}
                {todayPositionPercent !== null && (
                  <div
                    className="timeline-today-marker"
                    style={{ left: `${todayPositionPercent}%` }}
                  >
                    <div className="today-header-tag">TODAY</div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Rows Container */}
            <div className="timeline-rows-container">
              {processedSubscriptions.map(item => {
                const { statusInfo, periodInfo, positions } = item;
                const targetDateStr = item.isFreeTrial && item.trialEndDate ? item.trialEndDate : item.nextRenewalDate;

                return (
                  <div
                    key={item.id}
                    className={`timeline-row ${statusInfo.isOverdue ? 'is-overdue' : ''}`}
                    onClick={() => handleRowClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(item);
                      }
                    }}
                    aria-label={`View ${item.name} details: ${formatAmount(item.cost)}, ${statusInfo.label}`}
                  >
                    {/* Left Sticky Column: Subscription Info */}
                    <div className="timeline-sub-cell">
                      <div className="sub-meta">
                        <SubscriptionIcon subscription={item} size={34} />
                        <div className="sub-name-block">
                          <span className="sub-name" title={item.name}>{item.name}</span>
                          <div className="sub-details">
                            <span className="sub-cycle-badge">{item.billingCycle || 'Monthly'}</span>
                            <span>•</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {targetDateStr ? `Renews ${formatFriendlyDate(targetDateStr, false)}` : 'No renewal date'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="sub-cost-block">
                        <div className="sub-cost">{formatAmount(item.cost)}</div>
                        <span className={`sub-status-pill status-${statusInfo.statusKey}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Gantt Track Bar & Markers */}
                    <div className="timeline-track">
                      {/* Grid Background Vertical Lines */}
                      {dateColumns.map((dayDate, idx) => {
                        const dayLeft = (idx / rangeDays) * 100;
                        const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                        return (
                          <div
                            key={idx}
                            className={`grid-day-line ${isWeekend ? 'is-weekend' : ''}`}
                            style={{ left: `${dayLeft}%` }}
                          />
                        );
                      })}

                      {/* Today Vertical Line */}
                      {todayPositionPercent !== null && (
                        <div
                          className="timeline-today-marker"
                          style={{ left: `${todayPositionPercent}%` }}
                        />
                      )}

                      {/* If subscription lacks next renewal date */}
                      {!periodInfo.hasValidDates && (
                        <div className="timeline-no-date-notice">
                          ⚠️ No valid renewal date configured
                        </div>
                      )}

                      {/* Overdue Alert Flag on Left if Renewal Date Passed */}
                      {statusInfo.isOverdue && (
                        <div
                          className="timeline-overdue-flag"
                          title={`Renewal was due on ${formatFriendlyDate(targetDateStr)}`}
                        >
                          <AlertCircle size={13} />
                          <span>Overdue ({Math.abs(statusInfo.daysLeft)}d)</span>
                        </div>
                      )}

                      {/* Horizontal Billing Period Bar */}
                      {periodInfo.hasValidDates && positions.isBarVisible && (
                        <div
                          className={`timeline-period-bar ${
                            periodInfo.isVerified ? 'is-verified' : 'is-estimated'
                          } ${
                            statusInfo.isApproaching ? 'is-approaching' : ''
                          } ${
                            statusInfo.isOverdue ? 'is-overdue' : ''
                          } is-${item.status}`}
                          style={{
                            left: `${positions.barLeft}%`,
                            width: `${positions.barWidth}%`
                          }}
                          onMouseEnter={(e) => handleMouseEnterBar(e, item)}
                          onMouseLeave={handleMouseLeaveBar}
                        />
                      )}

                      {/* Milestone Renewal Date Marker Pin */}
                      {periodInfo.hasValidDates && positions.isMarkerVisible && (
                        <div
                          className={`timeline-renewal-pin ${
                            statusInfo.isApproaching ? 'is-approaching' : ''
                          } ${
                            statusInfo.isOverdue ? 'is-overdue' : ''
                          }`}
                          style={{ left: `${positions.markerLeft}%` }}
                          onMouseEnter={(e) => handleMouseEnterBar(e, item)}
                          onMouseLeave={handleMouseLeaveBar}
                          title={`${item.name} renewal: ${formatFriendlyDate(targetDateStr)}`}
                        >
                          <div className="pin-center-dot" />

                          {/* Renewal Amount Label Badge */}
                          <div className="timeline-cost-badge">
                            {formatAmount(item.cost)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Rich Interactive Floating Tooltip */}
      {tooltipData && tooltipData.subscription && (
        <div
          className="timeline-tooltip"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`
          }}
          role="tooltip"
        >
          <div className="tooltip-header">
            <div className="tooltip-brand">
              <SubscriptionIcon subscription={tooltipData.subscription} size={28} />
              <div>
                <div className="tooltip-title">{tooltipData.subscription.name}</div>
                <div className="tooltip-category">{tooltipData.subscription.category || 'General'}</div>
              </div>
            </div>
            <span className={`sub-status-pill status-${tooltipData.subscription.statusInfo.statusKey}`}>
              {tooltipData.subscription.statusInfo.label}
            </span>
          </div>

          <div className="tooltip-amount-row">
            <div className="tooltip-amount">
              {formatAmount(tooltipData.subscription.cost)}
            </div>
            <div className="tooltip-cycle">
              per {tooltipData.subscription.billingCycle || 'month'}
            </div>
          </div>

          <div className="tooltip-grid">
            <div>
              <div className="tooltip-cell-label">Next Renewal Date</div>
              <div className="tooltip-cell-val">
                {formatFriendlyDate(tooltipData.subscription.nextRenewalDate || tooltipData.subscription.trialEndDate)}
              </div>
            </div>
            <div>
              <div className="tooltip-cell-label">Payment Method</div>
              <div className="tooltip-cell-val">
                {tooltipData.subscription.paymentMethod || 'Credit Card'}
              </div>
            </div>
            <div>
              <div className="tooltip-cell-label">Last Billing Date</div>
              <div className="tooltip-cell-val">
                {tooltipData.subscription.lastRenewedDate
                  ? formatFriendlyDate(tooltipData.subscription.lastRenewedDate)
                  : tooltipData.subscription.firstBillingDate
                  ? formatFriendlyDate(tooltipData.subscription.firstBillingDate)
                  : 'Cycle calculated'}
              </div>
            </div>
            <div>
              <div className="tooltip-cell-label">Billing Period Status</div>
              <div className="tooltip-cell-val">
                {tooltipData.subscription.periodInfo.isVerified ? 'Verified record' : 'Estimated cycle'}
              </div>
            </div>
          </div>

          <div className="tooltip-action-hint">
            <span>Click row to view or modify details</span>
            <ExternalLink size={12} />
          </div>
        </div>
      )}
    </section>
  );
}
