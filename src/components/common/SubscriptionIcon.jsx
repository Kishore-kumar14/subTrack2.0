import React, { useState } from 'react';

// Crisp inline SVG brand icons for top subscription services
const BRAND_SVGS = {
  netflix: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#141414" />
      <path d="M15 11H20.5V37H15V11Z" fill="#E50914" />
      <path d="M27.5 11H33V37H27.5V11Z" fill="#E50914" />
      <path d="M15 11L33 37H27.5L15 19V11Z" fill="#B81D24" />
      <path d="M15 11L27.5 37H22L15 23V11Z" fill="#E50914" />
    </svg>
  ),
  spotify: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#191414" />
      <circle cx="24" cy="24" r="16" fill="#1DB954" />
      <path d="M31.5 20.8C25.8 17.4 16.5 17.1 11.2 18.7C10.3 19 9.4 18.5 9.1 17.6C8.8 16.7 9.3 15.8 10.2 15.5C16.3 13.6 26.6 14 33.1 17.9C33.9 18.4 34.2 19.4 33.7 20.2C33.2 20.9 32.2 21.2 31.5 20.8ZM31.2 25C30.7 25.7 29.8 26 29.1 25.5C24.3 22.5 16.9 21.7 11.5 23.3C10.7 23.5 9.9 23.1 9.6 22.3C9.4 21.5 9.8 20.7 10.6 20.5C16.8 18.6 25 19.6 30.6 23C31.3 23.3 31.5 24.3 31.2 25ZM28.8 29.1C28.4 29.7 27.6 29.9 27.1 29.5C23.1 27.1 17.1 26.4 12 28C11.3 28.2 10.6 27.8 10.4 27.1C10.2 26.4 10.6 25.7 11.3 25.5C17 23.8 23.6 24.5 28.3 27.4C28.8 27.7 29 28.5 28.8 29.1Z" fill="#191414" />
    </svg>
  ),
  'youtube-premium': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0F0F0F" />
      <rect x="8" y="14" width="32" height="20" rx="6" fill="#FF0000" />
      <polygon points="21,19 30,24 21,29" fill="#FFFFFF" />
    </svg>
  ),
  'openai-chatgpt': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#10A37F" />
      <path d="M34.5 22.2C34.1 19.5 32.2 17.4 29.6 16.9V15C29.6 12.8 27.8 11 25.6 11H22.4C20.2 11 18.4 12.8 18.4 15V16.9C15.8 17.4 13.9 19.5 13.5 22.2C11.6 23.4 10.7 25.7 11.4 27.9C12.1 30.1 14.2 31.6 16.5 31.6H17.2C17.9 33.8 19.9 35.4 22.3 35.8V37C22.3 37.6 22.7 38 23.3 38H24.7C25.3 38 25.7 37.6 25.7 37V35.8C28.1 35.4 30.1 33.8 30.8 31.6H31.5C33.8 31.6 35.9 30.1 36.6 27.9C37.3 25.7 36.4 23.4 34.5 22.2Z" stroke="#FFFFFF" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="20" cy="23" r="2" fill="#FFFFFF" />
      <circle cx="28" cy="23" r="2" fill="#FFFFFF" />
      <path d="M21 28C22 29.2 26 29.2 27 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'amazon-prime': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#001E2E" />
      <text x="24" y="22" textAnchor="middle" fill="#00A8E1" fontSize="13" fontWeight="900" fontFamily="sans-serif">prime</text>
      <path d="M12 28C18 33 30 33 36 28" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="36,26 38,30 34,29" fill="#FF9900" />
    </svg>
  ),
  'disney-hotstar': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0c1938" />
      <path d="M14 18C14 18 19 14 26 14C33 14 36 19 36 24C36 30 31 34 24 34C17 34 13 29 13 29" stroke="#1F80E0" strokeWidth="3" strokeLinecap="round" />
      <polygon points="28,21 30,25 34,25 31,27 32,31 28,28 25,31 26,27 23,25 27,25" fill="#FFCC00" />
    </svg>
  ),
  'github-copilot': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#181717" />
      <path fillRule="evenodd" clipRule="evenodd" d="M24 10C16.27 10 10 16.27 10 24C10 30.19 14.02 35.43 19.59 37.28C20.29 37.41 20.54 36.98 20.54 36.61C20.54 36.28 20.53 35.19 20.52 33.87C17 34.56 16.09 32.74 15.81 31.96C15.65 31.55 14.97 30.31 14.37 29.98C13.88 29.71 13.18 29.07 14.36 29.05C15.46 29.03 16.25 30.06 16.51 30.47C17.76 32.58 19.77 31.99 20.57 31.62C20.7 30.71 21.06 30.1 21.46 29.75C18.33 29.39 15.06 28.18 15.06 22.78C15.06 21.24 15.61 19.98 16.51 18.99C16.36 18.63 15.88 17.18 16.65 15.24C16.65 15.24 17.83 14.87 20.52 16.69C21.64 16.38 22.84 16.22 24.04 16.22C25.24 16.22 26.44 16.38 27.56 16.69C30.25 14.86 31.43 15.24 31.43 15.24C32.2 17.18 31.72 18.63 31.57 18.99C32.47 19.98 33.02 21.23 33.02 22.78C33.02 28.2 29.73 29.39 26.6 29.75C27.1 30.18 27.54 31.02 27.54 32.33C27.54 34.2 27.52 35.71 27.52 36.61C27.52 36.98 27.77 37.42 28.48 37.28C34.03 35.43 38.06 30.18 38.06 24C38.06 16.27 31.79 10 24 10Z" fill="#FFFFFF" />
    </svg>
  ),
  'google-one': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <path d="M33.6 24.3c0-.7-.1-1.4-.2-2H24v4.1h5.4c-.2 1.3-1 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.8z" fill="#4285F4" />
      <path d="M24 34c2.7 0 5-1 6.7-2.6l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1h-3.4v2.7C16.7 31.7 20.1 34 24 34z" fill="#34A853" />
      <path d="M18.4 25.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2v-2.7H15C14.4 20.2 14 22 14 24s.4 3.8 1 5l3.4-2.7z" fill="#FBBC05" />
      <path d="M24 17.6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C29 14.5 26.7 13.7 24 13.7c-3.9 0-7.3 2.3-9 5.6l3.4 2.7c.8-2.3 3-4.4 5.6-4.4z" fill="#EA4335" />
    </svg>
  ),
  'apple-one': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#000000" />
      <path d="M28.4 23.9C28.4 20.6 31 18.9 31.1 18.8C29.6 16.6 27.2 16.3 26.4 16.2C24.4 16 22.4 17.4 21.4 17.4C20.3 17.4 18.7 16.2 17.1 16.2C14.9 16.2 12.9 17.5 11.8 19.4C9.5 23.3 11.2 29.2 13.5 32.4C14.6 34 15.8 35.7 17.6 35.6C19.3 35.5 20 34.5 22 34.5C24.1 34.5 24.6 35.6 26.4 35.6C28.3 35.5 29.4 34 30.5 32.4C31.8 30.6 32.3 28.8 32.4 28.7C32.3 28.6 28.4 27.1 28.4 23.9Z" fill="#FFFFFF" />
      <path d="M25.3 14.4C26.2 13.3 26.8 11.7 26.6 10.2C25.2 10.3 23.6 11.1 22.7 12.2C21.9 13.1 21.2 14.8 21.5 16.3C23 16.4 24.5 15.5 25.3 14.4Z" fill="#FFFFFF" />
    </svg>
  ),
  'microsoft-365': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#201F1E" />
      <rect x="13" y="13" width="10" height="10" fill="#F25022" />
      <rect x="25" y="13" width="10" height="10" fill="#7FBA00" />
      <rect x="13" y="25" width="10" height="10" fill="#00A4EF" />
      <rect x="25" y="25" width="10" height="10" fill="#FFB900" />
    </svg>
  ),
  canva: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#00C4CC" />
      <text x="24" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="800" fontFamily="cursive, sans-serif">C</text>
    </svg>
  ),
  notion: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#000000" />
      <path d="M14 14L20 15.5V33L14 31.5V14Z" fill="#FFFFFF" />
      <path d="M20 15.5L31 14V30L20 33V15.5Z" fill="#E2E8F0" />
      <path d="M23 19L29 27.5V17L31 17.5V30L25 21.5V32L23 31.5V19Z" fill="#000000" />
    </svg>
  ),
  adobe: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FA0F00" />
      <polygon points="12,12 12,36 19.5,36 19.5,23" fill="#FFFFFF" />
      <polygon points="36,12 36,36 28.5,36 28.5,23" fill="#FFFFFF" />
      <polygon points="24,20 28,30 20,30" fill="#FFFFFF" />
    </svg>
  ),
  jio: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0A3A82" />
      <circle cx="24" cy="24" r="14" fill="#E31837" />
      <text x="24" y="29" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="sans-serif">Jio</text>
    </svg>
  ),
  airtel: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="24" cy="24" r="14" fill="#ED1C24" />
      <path d="M19 24C19 20 22 17 26 17C29 17 31 19 31 22C31 26 26 30 20 31" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  swiggy: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FC8019" />
      <path d="M24 13C19 13 16 16.5 16 21C16 25 19 28 24 33C29 28 32 25 32 21C32 16.5 29 13 24 13Z" fill="#FFFFFF" />
      <circle cx="24" cy="21" r="3.5" fill="#FC8019" />
    </svg>
  ),
  zomato: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#E23744" />
      <text x="24" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">z</text>
    </svg>
  ),
  playstation: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#003791" />
      <path d="M19 14V34L26 31V17L19 14Z" fill="#FFFFFF" />
      <path d="M28 27C31 27 34 25 34 23C34 20 31 19 28 19V27Z" fill="#FFFFFF" />
    </svg>
  ),
  xbox: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#107C10" />
      <circle cx="24" cy="24" r="14" fill="#0E6B0E" />
      <path d="M18 16C21 19 27 19 30 16C33 20 35 25 33 29C29 27 26 23 24 23C22 23 19 27 15 29C13 25 15 20 18 16Z" fill="#FFFFFF" />
    </svg>
  ),
  sonyliv: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#000000" />
      <rect x="12" y="14" width="7" height="20" rx="2" fill="#E50914" />
      <rect x="21" y="14" width="7" height="20" rx="2" fill="#00A8E1" />
      <rect x="30" y="14" width="7" height="20" rx="2" fill="#FFCC00" />
    </svg>
  ),
  linkedin: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0A66C2" />
      <rect x="14" y="20" width="4" height="14" fill="#FFFFFF" />
      <circle cx="16" cy="15" r="2.5" fill="#FFFFFF" />
      <path d="M22 20H26V22.2C26.6 21 28.2 20 30.5 20C34.5 20 35.5 22.5 35.5 26.5V34H31.5V27.5C31.5 25.5 31 23.5 29 23.5C27 23.5 26 25 26 27V34H22V20Z" fill="#FFFFFF" />
    </svg>
  ),
  'cult-fit': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#121212" />
      <path d="M24 11L32 20H26L24 16L22 20H16L24 11Z" fill="#FD3A69" />
      <path d="M24 37L16 28H22L24 32L26 28H32L24 37Z" fill="#FD3A69" />
      <circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />
    </svg>
  ),
  dropbox: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#0061FF" />
      <path d="M15 17L24 23L19 27.5L10 21.5L15 17Z" fill="#FFFFFF" />
      <path d="M33 17L38 21.5L29 27.5L24 23L33 17Z" fill="#FFFFFF" />
      <path d="M10 21.5L19 27.5L15 31.5L10 27V21.5Z" fill="#FFFFFF" />
      <path d="M38 21.5V27L33 31.5L29 27.5L38 21.5Z" fill="#FFFFFF" />
      <path d="M24 28L28.5 32L24 35.5L19.5 32L24 28Z" fill="#FFFFFF" />
    </svg>
  ),
  audible: (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#F7991C" />
      <circle cx="24" cy="24" r="13" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M21 19V29L29 24L21 19Z" fill="#FFFFFF" />
    </svg>
  ),
  'claude-ai': (size) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#CC785C" />
      <path d="M24 13V35M13 24H35M16 16L32 32M32 16L16 32" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  )
};

// Provider to brand key mapping
const getBrandKey = (sub) => {
  if (!sub) return null;
  const id = (sub.providerId || sub.id || '').toLowerCase();
  const name = (sub.name || '').toLowerCase();

  if (id.includes('netflix') || name.includes('netflix')) return 'netflix';
  if (id.includes('spotify') || name.includes('spotify')) return 'spotify';
  if (id.includes('youtube') || name.includes('youtube')) return 'youtube-premium';
  if (id.includes('chatgpt') || id.includes('openai') || name.includes('chatgpt') || name.includes('openai')) return 'openai-chatgpt';
  if (id.includes('prime') || name.includes('prime') || name.includes('amazon')) return 'amazon-prime';
  if (id.includes('disney') || id.includes('hotstar') || name.includes('disney') || name.includes('hotstar')) return 'disney-hotstar';
  if (id.includes('copilot') || id.includes('github') || name.includes('copilot') || name.includes('github')) return 'github-copilot';
  if (id.includes('google') || name.includes('google')) return 'google-one';
  if (id.includes('apple') || name.includes('apple') || id.includes('icloud')) return 'apple-one';
  if (id.includes('microsoft') || id.includes('ms-') || name.includes('microsoft') || name.includes('office')) return 'microsoft-365';
  if (id.includes('canva') || name.includes('canva')) return 'canva';
  if (id.includes('notion') || name.includes('notion')) return 'notion';
  if (id.includes('adobe') || name.includes('adobe') || name.includes('creative cloud')) return 'adobe';
  if (id.includes('jio') || name.includes('jio')) return 'jio';
  if (id.includes('airtel') || name.includes('airtel')) return 'airtel';
  if (id.includes('swiggy') || name.includes('swiggy')) return 'swiggy';
  if (id.includes('zomato') || name.includes('zomato')) return 'zomato';
  if (id.includes('playstation') || id.includes('ps-') || name.includes('playstation')) return 'playstation';
  if (id.includes('xbox') || name.includes('xbox')) return 'xbox';
  if (id.includes('sonyliv') || name.includes('sonyliv') || name.includes('sony liv')) return 'sonyliv';
  if (id.includes('linkedin') || name.includes('linkedin')) return 'linkedin';
  if (id.includes('cult') || name.includes('cult')) return 'cult-fit';
  if (id.includes('dropbox') || name.includes('dropbox')) return 'dropbox';
  if (id.includes('audible') || name.includes('audible')) return 'audible';
  if (id.includes('claude') || name.includes('claude') || id.includes('anthropic') || name.includes('anthropic')) return 'claude-ai';

  return null;
};

// Deduce website domain for favicon fallback
const getDomain = (sub) => {
  if (sub.website) {
    try {
      const url = new URL(sub.website);
      return url.hostname;
    } catch (e) {
      return sub.website.replace(/^https?:\/\//, '').split('/')[0];
    }
  }
  const cleanName = (sub.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanName) {
    return `${cleanName}.com`;
  }
  return null;
};

export default function SubscriptionIcon({
  subscription,
  size = 36,
  style = {},
  className = ''
}) {
  const [imgError, setImgError] = useState(false);

  if (!subscription) return null;

  const brandKey = getBrandKey(subscription);

  // 1. Direct SVG Vector Match (Instant, crisp, high fidelity)
  if (brandKey && BRAND_SVGS[brandKey]) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          ...style
        }}
      >
        {BRAND_SVGS[brandKey](size)}
      </div>
    );
  }

  // 2. Favicon API Fallback for custom subscriptions or non-standard providers
  const domain = getDomain(subscription);
  if (domain && !imgError) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          borderRadius: '10px',
          background: subscription.brandColor ? `${subscription.brandColor}22` : 'var(--bg-badge)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          ...style
        }}
      >
        <img
          src={faviconUrl}
          alt={subscription.name || 'Service'}
          width={size * 0.75}
          height={size * 0.75}
          onError={() => setImgError(true)}
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  // 3. Fallback Initial Monogram with Provider Brand Color
  const initial = subscription.iconText || subscription.name?.charAt(0) || 'S';
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        borderRadius: '10px',
        backgroundColor: subscription.brandColor || 'var(--primary)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${size * 0.45}px`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        userSelect: 'none',
        ...style
      }}
    >
      {initial}
    </div>
  );
}
