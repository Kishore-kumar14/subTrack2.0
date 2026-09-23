// 20+ Popular Service Providers with Authentic Recharge-Style Plans (Jio / Airtel format)

export const CATEGORIES = [
  'All',
  'Entertainment',
  'Music & Audio',
  'AI & Dev',
  'Productivity',
  'Gaming',
  'Utilities & Telecom',
  'Fitness & Health',
  'Lifestyle'
];

export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'UPI',
  'PayPal',
  'Apple Pay',
  'Net Banking',
  'Google Pay'
];

export const PROVIDER_CATALOG = [
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'Entertainment',
    brandColor: '#E50914',
    iconText: 'N',
    logo: '/logos/netflix-seeklogo.svg',
    website: 'https://netflix.com',
    description: 'Watch TV shows, movies, and award-winning Netflix originals.',
    plans: [
      {
        id: 'nflx-mobile',
        name: 'Mobile',
        costINR: 149,
        costUSD: 6.99,
        billingCycle: 'monthly',
        badge: 'Budget Friendly',
        features: ['1 phone or tablet', '480p standard resolution', 'Ad-free viewing', 'Download on 1 device']
      },
      {
        id: 'nflx-basic',
        name: 'Basic',
        costINR: 199,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: '',
        features: ['1 screen at a time', '720p HD resolution', 'Watch on TV, PC & Phone', 'Download on 1 device']
      },
      {
        id: 'nflx-standard',
        name: 'Standard HD',
        costINR: 499,
        costUSD: 15.49,
        billingCycle: 'monthly',
        badge: 'Popular',
        features: ['2 screens simultaneously', '1080p Full HD video', 'Download on 2 devices', 'Spatial audio']
      },
      {
        id: 'nflx-premium',
        name: 'Premium 4K UHD',
        costINR: 649,
        costUSD: 22.99,
        billingCycle: 'monthly',
        badge: 'Best Value (4K)',
        features: ['4 screens at the same time', 'Ultra HD 4K + HDR', 'Netflix spatial audio', 'Download on 6 devices']
      }
    ]
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Music & Audio',
    brandColor: '#1DB954',
    iconText: '♫',
    logo: '/logos/spotify-seeklogo.svg',
    website: 'https://spotify.com',
    description: 'Stream millions of ad-free songs, curated playlists, and podcasts.',
    plans: [
      {
        id: 'spot-student',
        name: 'Student Discount',
        costINR: 59,
        costUSD: 5.99,
        billingCycle: 'monthly',
        badge: '50% Off for Students',
        features: ['1 verified student account', 'Ad-free listening', 'Offline downloads', 'Hulu included (US)']
      },
      {
        id: 'spot-individual',
        name: 'Individual',
        costINR: 119,
        costUSD: 10.99,
        billingCycle: 'monthly',
        badge: 'Popular',
        features: ['1 Premium account', 'Ad-free music listening', 'Play anywhere offline', 'On-demand playback']
      },
      {
        id: 'spot-duo',
        name: 'Duo',
        costINR: 149,
        costUSD: 14.99,
        billingCycle: 'monthly',
        badge: 'For Couples',
        features: ['2 Premium accounts', 'Duo Mix shared playlist', 'Ad-free music', 'Separate logins']
      },
      {
        id: 'spot-family',
        name: 'Family',
        costINR: 179,
        costUSD: 16.99,
        billingCycle: 'monthly',
        badge: 'Up to 6 Accounts',
        features: ['6 Premium accounts', 'Family Mix & parental controls', 'Spotify Kids app', 'Independent libraries']
      },
      {
        id: 'spot-annual',
        name: 'Individual Annual',
        costINR: 1189,
        costUSD: 109.99,
        billingCycle: 'yearly',
        badge: 'Save 17%',
        features: ['1 Year prepaid', 'Ad-free music offline', 'High quality audio', 'Zero interruption']
      }
    ]
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'Entertainment',
    brandColor: '#00A8E1',
    iconText: 'P',
    logo: '/logos/amazon-prime-video-seeklogo.svg',
    website: 'https://amazon.com/prime',
    description: 'Free expedited delivery, Prime Video 4K, Prime Music & exclusive deals.',
    plans: [
      {
        id: 'prime-monthly',
        name: 'Prime Monthly',
        costINR: 299,
        costUSD: 14.99,
        billingCycle: 'monthly',
        badge: 'Flexible',
        features: ['Free 1-Day delivery', 'Prime Video streaming', 'Amazon Music included', 'Prime Gaming rewards']
      },
      {
        id: 'prime-annual',
        name: 'Prime Annual',
        costINR: 1499,
        costUSD: 139.00,
        billingCycle: 'yearly',
        badge: 'Best Value (Save 58%)',
        features: ['Full year coverage', 'Ultra HD Prime Video', 'Unlimited free fast shipping', 'Exclusive sale early access']
      },
      {
        id: 'prime-lite',
        name: 'Prime Lite Annual',
        costINR: 799,
        costUSD: 69.99,
        billingCycle: 'yearly',
        badge: 'Economy Saver',
        features: ['Free 2-day delivery', 'Prime Video on mobile (HD)', 'Early deals access', 'Single device']
      }
    ]
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'Entertainment',
    brandColor: '#FF0000',
    iconText: '▶',
    logo: '/logos/youtube-2017-icon-seeklogo-3.svg',
    website: 'https://youtube.com/premium',
    description: 'Ad-free YouTube videos, background playback, and YouTube Music Premium.',
    plans: [
      {
        id: 'yt-student',
        name: 'Student',
        costINR: 79,
        costUSD: 7.99,
        billingCycle: 'monthly',
        badge: 'Student Offer',
        features: ['Ad-free video & audio', 'Background play with screen off', 'YouTube Music included', 'Offline downloads']
      },
      {
        id: 'yt-individual',
        name: 'Individual',
        costINR: 129,
        costUSD: 13.99,
        billingCycle: 'monthly',
        badge: 'Most Popular',
        features: ['Ad-free on TV, Web, Phone', 'Background play & PiP', 'Full YouTube Music Premium', '1080p Premium bitrate']
      },
      {
        id: 'yt-family',
        name: 'Family Pack',
        costINR: 189,
        costUSD: 22.99,
        billingCycle: 'monthly',
        badge: 'Up to 5 Members',
        features: ['Share with 5 family members (13+)', 'Individual personalized feeds', 'Background play for all', 'Music Premium for each']
      },
      {
        id: 'yt-annual',
        name: 'Individual Annual',
        costINR: 1290,
        costUSD: 139.99,
        billingCycle: 'yearly',
        badge: 'Save 2 Months',
        features: ['12 Months prepaid access', 'Never see video ads', 'Download videos offline', 'Includes YouTube Music']
      }
    ]
  },
  {
    id: 'disney-hotstar',
    name: 'Disney+ Hotstar',
    category: 'Entertainment',
    brandColor: '#0c2044',
    iconText: 'D+',
    logo: '/logos/jiohotstar-seeklogo.svg',
    website: 'https://hotstar.com',
    description: 'Disney, Marvel, Star Wars, Pixar, HBO shows & live Premier sports.',
    plans: [
      {
        id: 'disney-mobile',
        name: 'Mobile Annual',
        costINR: 499,
        costUSD: 39.99,
        billingCycle: 'yearly',
        badge: 'Mobile Only',
        features: ['1 mobile device', 'HD 720p quality', 'Full catalog access', 'Stereo audio']
      },
      {
        id: 'disney-super',
        name: 'Super Annual',
        costINR: 899,
        costUSD: 79.99,
        billingCycle: 'yearly',
        badge: 'Popular',
        features: ['2 concurrent screens (TV/Web/Phone)', 'Full HD 1080p', 'Dolby 5.1 audio', 'All sports & movies']
      },
      {
        id: 'disney-premium',
        name: 'Premium 4K Annual',
        costINR: 1499,
        costUSD: 139.99,
        billingCycle: 'yearly',
        badge: '4K Ultra HD',
        features: ['4 devices simultaneously', '4K Ultra HD + Dolby Vision', 'Dolby Atmos immersive audio', 'Ad-free entertainment']
      }
    ]
  },
  {
    id: 'openai-chatgpt',
    name: 'OpenAI ChatGPT',
    category: 'AI & Dev',
    brandColor: '#10A37F',
    iconText: '⚡',
    logo: '/logos/open-ai-seeklogo.svg',
    website: 'https://chatgpt.com',
    description: 'Access GPT-4o, advanced reasoning, DALL-E, deep research, and custom GPTs.',
    plans: [
      {
        id: 'gpt-plus',
        name: 'ChatGPT Plus',
        costINR: 1999,
        costUSD: 20.00,
        billingCycle: 'monthly',
        badge: 'Most Popular',
        features: ['Access to GPT-4o & o1 reasoning', 'DALL-E 3 image generation', 'Advanced Voice Mode', 'Canvas code/writing workspace']
      },
      {
        id: 'gpt-team',
        name: 'ChatGPT Team',
        costINR: 2500,
        costUSD: 25.00,
        billingCycle: 'monthly',
        badge: 'For Collaboration',
        features: ['Higher rate limits', 'Admin console & team workspace', 'Data excluded from training', 'Shared custom GPTs']
      },
      {
        id: 'gpt-pro',
        name: 'ChatGPT Pro',
        costINR: 16500,
        costUSD: 200.00,
        billingCycle: 'monthly',
        badge: 'Power Researchers',
        features: ['Unlimited o1 model usage', 'o1 Pro mode high compute', 'Ultra-fast priority processing', 'Exclusive preview tools']
      }
    ]
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'AI & Dev',
    brandColor: '#24292e',
    iconText: '⌥',
    logo: '/logos/github-seeklogo.svg',
    website: 'https://github.com/features/copilot',
    description: 'Your AI pair programmer built inside VS Code, JetBrains, and GitHub CLI.',
    plans: [
      {
        id: 'copilot-monthly',
        name: 'Copilot Individual',
        costINR: 830,
        costUSD: 10.00,
        billingCycle: 'monthly',
        badge: 'Developer Favorite',
        features: ['Code completions in IDE', 'Chat in IDE & terminal', 'Pull request summaries', 'Context-aware documentation']
      },
      {
        id: 'copilot-annual',
        name: 'Copilot Annual',
        costINR: 8300,
        costUSD: 100.00,
        billingCycle: 'yearly',
        badge: 'Save ~17%',
        features: ['Prepaid full year', 'Copilot Workspace preview', 'CLI coding assistant', 'IDE completions']
      },
      {
        id: 'gh-pro',
        name: 'GitHub Pro',
        costINR: 330,
        costUSD: 4.00,
        billingCycle: 'monthly',
        badge: 'Pro Repos',
        features: ['3,000 Actions minutes/month', '2GB GitHub Packages', 'Advanced code review tools', 'Protected branches']
      }
    ]
  },
  {
    id: 'google-one',
    name: 'Google One',
    category: 'Utilities & Telecom',
    brandColor: '#4285F4',
    iconText: 'G',
    website: 'https://one.google.com',
    description: 'Expanded cloud storage across Google Drive, Gmail, and Google Photos.',
    plans: [
      {
        id: 'g-100gb',
        name: 'Basic (100 GB)',
        costINR: 130,
        costUSD: 1.99,
        billingCycle: 'monthly',
        badge: 'Essential',
        features: ['100 GB cloud storage', 'Share with up to 5 family members', 'Google Photos editing tools', 'Google experts support']
      },
      {
        id: 'g-200gb',
        name: 'Standard (200 GB)',
        costINR: 210,
        costUSD: 2.99,
        billingCycle: 'monthly',
        badge: 'Popular',
        features: ['200 GB cloud storage', 'Share with 5 people', '3% Google Store cash back', 'Enhanced photo features']
      },
      {
        id: 'g-2tb-ai',
        name: 'AI Premium (2 TB)',
        costINR: 1950,
        costUSD: 19.99,
        billingCycle: 'monthly',
        badge: 'Gemini Advanced',
        features: ['2 TB cloud storage', 'Gemini Advanced AI model', 'Gemini in Docs, Gmail, Sheets', '10% back in Google Store']
      },
      {
        id: 'g-100gb-annual',
        name: 'Basic 100GB Annual',
        costINR: 1300,
        costUSD: 19.99,
        billingCycle: 'yearly',
        badge: 'Save 17%',
        features: ['Prepaid annual savings', '100 GB shared storage', 'Auto phone backup', 'Exclusive member perks']
      }
    ]
  },
  {
    id: 'apple-one',
    name: 'Apple One',
    category: 'Entertainment',
    brandColor: '#A2AAAD',
    iconText: '',
    website: 'https://apple.com/apple-one',
    description: 'Bundle Apple Music, Apple TV+, Apple Arcade, and iCloud+ into one simple plan.',
    plans: [
      {
        id: 'apple-music-ind',
        name: 'Apple Music',
        costINR: 99,
        costUSD: 10.99,
        billingCycle: 'monthly',
        badge: 'Lossless Audio',
        features: ['100M songs ad-free', 'Lossless & Spatial Audio Dolby Atmos', 'Time-synced lyrics', 'Siri integration']
      },
      {
        id: 'apple-one-ind',
        name: 'Apple One Individual',
        costINR: 195,
        costUSD: 19.95,
        billingCycle: 'monthly',
        badge: 'Best Combo',
        features: ['Apple Music', 'Apple TV+ (4K originals)', 'Apple Arcade (200+ games)', '50GB iCloud+ storage']
      },
      {
        id: 'apple-one-fam',
        name: 'Apple One Family',
        costINR: 365,
        costUSD: 25.95,
        billingCycle: 'monthly',
        badge: 'Up to 6 People',
        features: ['Share with up to 5 family members', 'Apple Music & Apple TV+', 'Apple Arcade for all', '200GB iCloud+ shared']
      }
    ]
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'Productivity',
    brandColor: '#D83B01',
    iconText: '田',
    logo: '/logos/microsoft-seeklogo.svg',
    website: 'https://microsoft.com/microsoft-365',
    description: 'Word, Excel, PowerPoint, Outlook, and 1TB OneDrive cloud storage.',
    plans: [
      {
        id: 'ms-personal',
        name: 'Personal (1 Person)',
        costINR: 489,
        costUSD: 6.99,
        billingCycle: 'monthly',
        badge: 'For Solo Pros',
        features: ['1 Person on 5 devices', '1 TB OneDrive cloud storage', 'Word, Excel, PowerPoint, Outlook', 'Microsoft Defender security']
      },
      {
        id: 'ms-family',
        name: 'Family (Up to 6)',
        costINR: 619,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: 'Most Popular',
        features: ['Up to 6 People', '6 TB total storage (1TB each)', 'Premium office apps for all', 'Family Safety location alerts']
      },
      {
        id: 'ms-family-annual',
        name: 'Family Annual Saver',
        costINR: 6199,
        costUSD: 99.99,
        billingCycle: 'yearly',
        badge: 'Save 16%',
        features: ['Full year prepaid', '6 TB OneDrive total', 'Cross-platform Mac, PC, iOS, Android', 'Always latest Office version']
      }
    ]
  },
  {
    id: 'adobe-cc',
    name: 'Adobe Creative Cloud',
    category: 'Productivity',
    brandColor: '#FF0000',
    iconText: 'Ai',
    website: 'https://adobe.com/creativecloud',
    description: 'Industry-standard creative apps: Photoshop, Illustrator, Premiere Pro, After Effects.',
    plans: [
      {
        id: 'adobe-photo',
        name: 'Photography Plan (20GB)',
        costINR: 797,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: 'Photographers',
        features: ['Lightroom, Lightroom Classic', 'Photoshop on desktop and iPad', '20 GB cloud storage', 'Adobe Portfolio & Fonts']
      },
      {
        id: 'adobe-single',
        name: 'Single App (e.g. Premiere)',
        costINR: 1675,
        costUSD: 20.99,
        billingCycle: 'monthly',
        badge: 'Specialized',
        features: ['1 Creative Cloud desktop app', '100 GB cloud storage', 'Generative AI credits', 'Adobe Express included']
      },
      {
        id: 'adobe-all-apps',
        name: 'All Apps Suite',
        costINR: 4230,
        costUSD: 54.99,
        billingCycle: 'monthly',
        badge: 'Complete Creative Power',
        features: ['20+ Creative desktop & mobile apps', 'Photoshop, Illustrator, Premiere, After Effects', '100 GB storage', '1,000 monthly AI generative credits']
      }
    ]
  },
  {
    id: 'playstation-plus',
    name: 'PlayStation Plus',
    category: 'Gaming',
    brandColor: '#003791',
    iconText: 'PS',
    website: 'https://playstation.com/ps-plus',
    description: 'Online multiplayer, monthly downloadable games, and game catalogs on PS4/PS5.',
    plans: [
      {
        id: 'ps-essential',
        name: 'Essential Monthly',
        costINR: 499,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: 'Online Gaming',
        features: ['Online multiplayer access', '3 Monthly downloadable games', 'Cloud save storage', 'Exclusive store discounts']
      },
      {
        id: 'ps-extra',
        name: 'Extra Annual',
        costINR: 6699,
        costUSD: 134.99,
        billingCycle: 'yearly',
        badge: 'Catalog of 400+ Games',
        features: ['All Essential perks', 'Huge Game Catalog (400+ PS4/PS5 hits)', 'Ubisoft+ Classics catalog', 'Updated monthly']
      },
      {
        id: 'ps-deluxe',
        name: 'Deluxe / Premium Annual',
        costINR: 7599,
        costUSD: 159.99,
        billingCycle: 'yearly',
        badge: 'Ultimate Tier',
        features: ['All Extra & Essential perks', 'Classics catalog (PS1, PS2, PSP)', 'Cloud streaming PS5 titles', 'Time-limited game trials']
      }
    ]
  },
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    category: 'Gaming',
    brandColor: '#107C10',
    iconText: 'X',
    website: 'https://xbox.com/game-pass',
    description: 'Play hundreds of high-quality games on PC, console, and cloud on day one.',
    plans: [
      {
        id: 'xbox-pc',
        name: 'PC Game Pass',
        costINR: 349,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: 'PC Gamers',
        features: ['Hundreds of PC games', 'Day one releases from Xbox & Bethesda', 'EA Play membership included', 'Member discounts & deals']
      },
      {
        id: 'xbox-ultimate',
        name: 'Ultimate (Console + PC + Cloud)',
        costINR: 549,
        costUSD: 16.99,
        billingCycle: 'monthly',
        badge: 'Best Value Gaming',
        features: ['PC & Xbox Console games', 'Cloud gaming on phone, TV, tablet', 'EA Play included', 'Day-one blockbusters']
      }
    ]
  },
  {
    id: 'canva',
    name: 'Canva Pro',
    category: 'Productivity',
    brandColor: '#00C4CC',
    iconText: 'C',
    website: 'https://canva.com',
    description: 'Visual suite for social graphics, presentations, AI Magic Studio, and brand kits.',
    plans: [
      {
        id: 'canva-pro-monthly',
        name: 'Canva Pro Monthly',
        costINR: 499,
        costUSD: 12.99,
        billingCycle: 'monthly',
        badge: 'Creative Freedom',
        features: ['100M+ premium stock photos & videos', 'Magic Studio AI tools & background remover', '1TB cloud storage', 'Unlimited brand kits']
      },
      {
        id: 'canva-pro-annual',
        name: 'Canva Pro Annual',
        costINR: 3999,
        costUSD: 119.99,
        billingCycle: 'yearly',
        badge: 'Save 33%',
        features: ['Prepaid 1-year access', 'Full premium templates & fonts', 'Schedule social posts directly', '24/7 Priority support']
      },
      {
        id: 'canva-teams',
        name: 'Canva for Teams',
        costINR: 659,
        costUSD: 14.99,
        billingCycle: 'monthly',
        badge: 'For 3+ Members',
        features: ['Brand control & workflow approvals', 'Team templates & folder sharing', 'Collaborate in real time', 'Centralized billing']
      }
    ]
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    brandColor: '#000000',
    iconText: 'N',
    website: 'https://notion.so',
    description: 'Connected workspace for wiki, docs, project management, and automated databases.',
    plans: [
      {
        id: 'notion-plus-monthly',
        name: 'Notion Plus',
        costINR: 830,
        costUSD: 10.00,
        billingCycle: 'monthly',
        badge: 'Most Popular',
        features: ['Unlimited blocks for teams', 'Unlimited file uploads', '30-day page history', 'Invite up to 100 guests']
      },
      {
        id: 'notion-plus-annual',
        name: 'Notion Plus Annual',
        costINR: 6600,
        costUSD: 96.00,
        billingCycle: 'yearly',
        badge: 'Save 20%',
        features: ['Prepaid annual billing ($8/mo)', 'Custom sync databases', 'Unlimited page blocks', 'Full collaboration']
      }
    ]
  },
  {
    id: 'linkedin-premium',
    name: 'LinkedIn Premium',
    category: 'Productivity',
    brandColor: '#0A66C2',
    iconText: 'in',
    website: 'https://linkedin.com/premium',
    description: 'Stand out to recruiters, see who viewed your profile, and message anyone with InMail.',
    plans: [
      {
        id: 'li-career',
        name: 'Premium Career',
        costINR: 1566,
        costUSD: 29.99,
        billingCycle: 'monthly',
        badge: 'Job Seekers',
        features: ['5 InMail messages per month', 'See who viewed your profile in past 365 days', 'Applicant insights & salary data', 'LinkedIn Learning access']
      },
      {
        id: 'li-business',
        name: 'Premium Business',
        costINR: 2899,
        costUSD: 59.99,
        billingCycle: 'monthly',
        badge: 'Business Growth',
        features: ['15 InMail messages per month', 'Unlimited people browsing', 'Company growth & employee trends', 'Exclusive business insights']
      }
    ]
  },
  {
    id: 'jiocinema',
    name: 'JioCinema',
    category: 'Entertainment',
    brandColor: '#D30068',
    iconText: 'Jio',
    logo: '/logos/jiohotstar-seeklogo.svg',
    website: 'https://jiocinema.com',
    description: 'Premium HBO, Peacock, Warner Bros movies, and ad-free streaming.',
    plans: [
      {
        id: 'jio-premium-mo',
        name: 'Premium Monthly',
        costINR: 29,
        costUSD: 1.49,
        billingCycle: 'monthly',
        badge: 'Super Low Cost',
        features: ['Ad-free streaming (except sports)', '4K Ultra HD quality', '1 device viewing', 'Download content offline']
      },
      {
        id: 'jio-family-mo',
        name: 'Family Monthly',
        costINR: 89,
        costUSD: 3.99,
        billingCycle: 'monthly',
        badge: 'Family 4 Screens',
        features: ['Ad-free entertainment', '4 concurrent devices', '4K resolution', 'All Hollywood titles']
      },
      {
        id: 'jio-annual',
        name: 'Premium Annual',
        costINR: 299,
        costUSD: 9.99,
        billingCycle: 'yearly',
        badge: 'Best Value Annual',
        features: ['12 Months ad-free HBO & WB content', '4K video on TV, PC & Phone', 'Early access releases', 'Prepaid savings']
      }
    ]
  },
  {
    id: 'airtel-xstream',
    name: 'Airtel Xstream Play',
    category: 'Utilities & Telecom',
    brandColor: '#ED1C24',
    iconText: 'airtel',
    logo: '/logos/airtel-xstream-seeklogo.svg',
    website: 'https://airtel.in/xstream',
    description: 'Aggregated streaming for 20+ OTT apps (SonyLIV, Zee5, Lionsgate, Fancode) in one app.',
    plans: [
      {
        id: 'airtel-prem-mo',
        name: 'Premium Monthly',
        costINR: 149,
        costUSD: 4.99,
        billingCycle: 'monthly',
        badge: '20+ OTT Apps',
        features: ['SonyLIV & Zee5 included', '2 screens simultaneously', 'Single sign-on for 20+ apps', 'Watch on Mobile & TV']
      },
      {
        id: 'airtel-prem-yr',
        name: 'Premium Annual',
        costINR: 1499,
        costUSD: 39.99,
        billingCycle: 'yearly',
        badge: 'Save 17%',
        features: ['1 full year of 20+ OTT platforms', 'Stream in 1080p Full HD', 'TV and mobile app support', 'No individual sub needed']
      }
    ]
  },
  {
    id: 'cult-fit',
    name: 'Cult.fit Gym & Fitness',
    category: 'Fitness & Health',
    brandColor: '#FD3A69',
    iconText: 'cult',
    website: 'https://cult.fit',
    description: 'Unlimited access to Cult group classes, premium gyms, home workouts, and sports facilities.',
    plans: [
      {
        id: 'cult-elite-mo',
        name: 'Cult Elite Monthly',
        costINR: 3500,
        costUSD: 49.99,
        billingCycle: 'monthly',
        badge: 'Flexible Fitness',
        features: ['Unlimited Cult group classes (Boxing, HIIT, Yoga, Dance)', 'Access to premium gym centers', 'Smart class scheduling', 'Pause membership option']
      },
      {
        id: 'cult-elite-annual',
        name: 'Cult Elite 12-Month',
        costINR: 14500,
        costUSD: 189.99,
        billingCycle: 'yearly',
        badge: 'Best Fitness Value',
        features: ['1 Year unlimited center access', 'Free 45 days membership pause', 'Complimentary sports gear kit', 'Body composition analysis']
      },
      {
        id: 'cult-home-annual',
        name: 'Cult Pass Home',
        costINR: 1499,
        costUSD: 24.99,
        billingCycle: 'yearly',
        badge: 'Home Workouts',
        features: ['1000+ live home workouts', 'Energy meter tracking', 'Yoga & meditation guides', 'Diet recipes']
      }
    ]
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Utilities & Telecom',
    brandColor: '#0061FF',
    iconText: '▣',
    website: 'https://dropbox.com',
    description: 'Cloud storage, automated file backup, document signing, and file sharing.',
    plans: [
      {
        id: 'db-plus-mo',
        name: 'Dropbox Plus (2 TB)',
        costINR: 830,
        costUSD: 9.99,
        billingCycle: 'monthly',
        badge: '2TB Solo',
        features: ['2,000 GB encrypted storage', '30-day file recovery', 'Dropbox Passwords vault', 'Large file delivery up to 2GB']
      },
      {
        id: 'db-plus-yr',
        name: 'Dropbox Plus Annual',
        costINR: 8300,
        costUSD: 99.99,
        billingCycle: 'yearly',
        badge: 'Save 17%',
        features: ['Prepaid 1 year', 'Full device automatic backup', 'Watermarking & password links', 'Remote device wipe']
      }
    ]
  },
  {
    id: 'audible',
    name: 'Audible',
    category: 'Music & Audio',
    brandColor: '#F8991C',
    iconText: '📖',
    website: 'https://audible.com',
    description: 'World\'s largest selection of audiobooks, exclusive podcasts, and audio originals.',
    plans: [
      {
        id: 'audible-mo',
        name: 'Audible Monthly',
        costINR: 199,
        costUSD: 14.95,
        billingCycle: 'monthly',
        badge: '1 Book Credit/Mo',
        features: ['1 credit monthly for any audiobook', 'Unlimited access to Plus Catalog', 'Keep purchased audiobooks forever', 'Exclusive 30% member discount']
      },
      {
        id: 'audible-yr',
        name: 'Audible Annual (12 Credits)',
        costINR: 2388,
        costUSD: 149.50,
        billingCycle: 'yearly',
        badge: '12 Credits Upfront',
        features: ['12 credits immediately', 'Plus Catalog unlimited listening', 'Member sales & daily deals', 'Listen across Kindle & phones']
      }
    ]
  },
  {
    id: 'claude-ai',
    name: 'Anthropic Claude Pro',
    category: 'AI & Dev',
    brandColor: '#D97706',
    iconText: '✳',
    website: 'https://claude.ai',
    description: 'Access Claude 3.5 Sonnet, 200k token context window, Projects, and Artifacts.',
    plans: [
      {
        id: 'claude-pro',
        name: 'Claude Pro',
        costINR: 1999,
        costUSD: 20.00,
        billingCycle: 'monthly',
        badge: 'Pro AI Workspace',
        features: ['5x more usage than free tier', 'Access to Claude 3.5 Sonnet & Haiku', 'Claude Artifacts interactive preview', 'Projects knowledge management']
      }
    ]
  }
];
