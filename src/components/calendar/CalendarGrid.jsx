import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function CalendarGrid({ onSelectDay }) {
  const { subscriptions } = useSubscriptions();
  const { formatAmount } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateString: d.toISOString().split('T')[0]
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNum: i,
        isCurrentMonth: true,
        dateString: d.toISOString().split('T')[0]
      });
    }

    // Next month filler days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNum: i,
        isCurrentMonth: false,
        dateString: d.toISOString().split('T')[0]
      });
    }

    return days;
  }, [year, month]);

  // Map subscriptions to date keys
  // For monthly subscriptions, match the day-of-month!
  const dateSubscriptionMap = useMemo(() => {
    const map = {};

    subscriptions.forEach(sub => {
      if (sub.status === 'cancelled' || sub.status === 'paused') return;

      const renewalDateStr = sub.isFreeTrial && sub.trialEndDate ? sub.trialEndDate : sub.nextRenewalDate;
      if (!renewalDateStr) return;

      const renewalDate = new Date(renewalDateStr);
      const subDay = renewalDate.getDate();

      // For calendar view in any month, check if renewal falls on this date
      calendarDays.forEach(day => {
        if (!day.isCurrentMonth) return;

        let matches = false;
        // Exact date match
        if (day.dateString === renewalDateStr) {
          matches = true;
        } else if (sub.billingCycle === 'monthly' && day.dayNum === subDay) {
          // Repeats monthly on same day number
          matches = true;
        }

        if (matches) {
          if (!map[day.dateString]) map[day.dateString] = [];
          map[day.dateString].push(sub);
        }
      });
    });

    return map;
  }, [subscriptions, calendarDays]);

  // Total projected spend for currently viewed month
  const monthlyProjectedSpend = useMemo(() => {
    let total = 0;
    Object.keys(dateSubscriptionMap).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date.getMonth() === month && date.getFullYear() === year) {
        dateSubscriptionMap[dateStr].forEach(s => {
          total += Number(s.cost || 0);
        });
      }
    });
    return total;
  }, [dateSubscriptionMap, month, year]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
      {/* Calendar Navigation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Projected Outflow: <strong style={{ color: 'var(--text-primary)' }}>{formatAmount(monthlyProjectedSpend)}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleToday}
            className="btn btn-secondary btn-sm"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {daysOfWeek.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: 'var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginTop: '0.5rem'
        }}
      >
        {calendarDays.map((day, idx) => {
          const subs = dateSubscriptionMap[day.dateString] || [];
          const isToday = day.dateString === todayStr;

          return (
            <div
              key={idx}
              onClick={() => {
                if (subs.length > 0) onSelectDay(day.dateString, subs);
              }}
              style={{
                minHeight: '105px',
                padding: '0.5rem',
                backgroundColor: isToday
                  ? 'rgba(99, 102, 241, 0.08)'
                  : day.isCurrentMonth
                  ? 'var(--bg-card)'
                  : 'rgba(10, 14, 25, 0.4)',
                opacity: day.isCurrentMonth ? 1 : 0.4,
                cursor: subs.length > 0 ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'background-color var(--transition-fast)',
                border: isToday ? '1.5px solid var(--primary-light)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (subs.length > 0) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isToday
                  ? 'rgba(99, 102, 241, 0.08)'
                  : day.isCurrentMonth
                  ? 'var(--bg-card)'
                  : 'rgba(10, 14, 25, 0.4)';
              }}
            >
              {/* Day Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 800 : 600,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  {day.dayNum}
                </span>

                {subs.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--primary-light)'
                    }}
                  >
                    {subs.length} sub{subs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Badges of subscriptions due */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                {subs.slice(0, 2).map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: `${sub.brandColor || 'var(--primary)'}22`,
                      borderLeft: `2.5px solid ${sub.brandColor || 'var(--primary)'}`,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{sub.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatAmount(sub.cost)}</span>
                  </div>
                ))}
                {subs.length > 2 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    +{subs.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
