import React from 'react';

export default function Logo({
  size = 'md',
  showTagline = false,
  showText = true,
  iconOnly = false,
  onClick = null
}) {
  // Dimension mapping
  const iconSizes = {
    sm: 34,
    md: 46,
    lg: 84,
    xl: 120
  };

  const currentIconSize = iconSizes[size] || 46;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: showTagline ? 'column' : 'row',
        alignItems: 'center',
        gap: showTagline ? '0.75rem' : '0.65rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Exact Vector Replica of SubTrack Logo from User's Image */}
        <svg
          width={currentIconSize}
          height={currentIconSize}
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 6px 14px rgba(99, 102, 241, 0.25))', flexShrink: 0 }}
        >
          <defs>
            {/* Calendar Gradient: Blue to Purple */}
            <linearGradient id="calBorderGrad" x1="40" y1="180" x2="160" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0072ff" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            {/* Overlapping Dollar Coin Gradient */}
            <linearGradient id="coinGrad" x1="120" y1="190" x2="190" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="45%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            {/* Coin shadow filter */}
            <filter id="coinShadow" x="110" y="105" width="105" height="105" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Top Calendar Loops / Rings */}
          <rect x="68" y="24" width="16" height="34" rx="8" fill="#0f172a" />
          <rect x="126" y="24" width="16" height="34" rx="8" fill="#0f172a" />

          {/* Calendar Body (Rounded Gradient Card) */}
          <rect
            x="36"
            y="42"
            width="138"
            height="144"
            rx="38"
            fill="url(#calBorderGrad)"
          />

          {/* Inner White Sheet */}
          <rect
            x="48"
            y="68"
            width="114"
            height="106"
            rx="24"
            fill="#ffffff"
          />

          {/* Row 1: Green Dot & Bar */}
          <circle cx="70" cy="98" r="8" fill="#10b981" />
          <rect x="88" y="94" width="54" height="8" rx="4" fill="#e2e8f0" />

          {/* Row 2: Red Dot & Bar */}
          <circle cx="70" cy="122" r="8" fill="#f43f5e" />
          <rect x="88" y="118" width="42" height="8" rx="4" fill="#e2e8f0" />

          {/* Row 3: Blue Dot & Bar */}
          <circle cx="70" cy="146" r="8" fill="#3b82f6" />
          <rect x="88" y="142" width="34" height="8" rx="4" fill="#e2e8f0" />

          {/* Overlapping Dollar Coin with White Outer Ring */}
          <g filter="url(#coinShadow)">
            <circle cx="160" cy="154" r="42" fill="#ffffff" />
            <circle cx="160" cy="154" r="37" fill="url(#coinGrad)" />
            {/* Dollar Sign Symbol */}
            <text
              x="160"
              y="169"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontSize="44"
              fontWeight="800"
            >
              $
            </text>
          </g>
        </svg>

        {/* Text Logo: SubTrack */}
        {showText && !iconOnly && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: size === 'sm' ? '1.25rem' : size === 'lg' ? '2.4rem' : '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                fontFamily: 'var(--font-heading)'
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>Sub</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Track
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Divider & 3 Colored Dots & Tagline (from the image) */}
      {showTagline && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Horizontal line with Green, Red, Blue dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              width: '100%',
              maxWidth: size === 'lg' ? '260px' : '190px',
              margin: '0.4rem 0'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }} />
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: size === 'lg' ? '0.95rem' : '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textAlign: 'center'
            }}
          >
            Track. Understand. Save.
          </div>
        </div>
      )}
    </div>
  );
}
