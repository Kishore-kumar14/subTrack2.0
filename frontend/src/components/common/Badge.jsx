import React from 'react';

export function CategoryBadge({ category }) {
  const categoryColors = {
    'Entertainment': 'rose',
    'Music & Audio': 'emerald',
    'AI & Dev': 'primary',
    'Productivity': 'cyan',
    'Gaming': 'purple',
    'Utilities & Telecom': 'amber',
    'Fitness & Health': 'rose',
    'Lifestyle': 'cyan'
  };

  const badgeType = categoryColors[category] || 'primary';

  return (
    <span className={`badge badge-${badgeType}`}>
      {category}
    </span>
  );
}

export function StatusBadge({ status, isTrial }) {
  if (isTrial || status === 'trial') {
    return (
      <span className="badge badge-amber" style={{ animation: 'pulseGlow 2s infinite' }}>
        Free Trial
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span className="badge badge-emerald">
        Active
      </span>
    );
  }

  if (status === 'paused') {
    return (
      <span className="badge badge-amber">
        Paused
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="badge badge-rose">
        Cancelled
      </span>
    );
  }

  return (
    <span className="badge badge-primary">
      {status}
    </span>
  );
}
