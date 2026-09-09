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
        {/* SubTrack Logo Image (Scalable Vector SVG) */}
        <img
          src="/logo.svg"
          alt="SubTrack Logo"
          width={currentIconSize}
          height={currentIconSize}
          style={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.25))',
            flexShrink: 0
          }}
        />

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
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
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
