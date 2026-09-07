// Realistic seed data for immediate demonstration and onboarding

// Helper to calculate dynamic dates relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_USER = {
  id: 'usr-alex-01',
  name: 'Alex Morgan',
  email: 'alex.morgan@subtrack.app',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currency: 'INR', // Default currency: INR (₹) or USD ($)
  monthlyBudget: 8000,
  joinedDate: '2024-01-15',
  preferences: {
    browserAlerts: true,
    emailAlerts: true,
    alertDaysBefore: 3,
    weeklyReport: true
  }
};

export const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-netflix',
    providerId: 'netflix',
    name: 'Netflix',
    planName: 'Premium 4K UHD',
    category: 'Entertainment',
    cost: 649,
    costUSD: 22.99,
    billingCycle: 'monthly',
    firstBillingDate: '2023-04-10',
    nextRenewalDate: getRelativeDate(2), // Renews in 2 days (Urgent Alert!)
    paymentMethod: 'Credit Card',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'daily',
    brandColor: '#E50914',
    iconText: 'N',
    notes: 'Family sharing on living room TV & 2 phones.'
  },
  {
    id: 'sub-canva',
    providerId: 'canva',
    name: 'Canva Pro',
    planName: 'Pro Free Trial',
    category: 'Productivity',
    cost: 499,
    costUSD: 12.99,
    billingCycle: 'monthly',
    firstBillingDate: getRelativeDate(-28),
    nextRenewalDate: getRelativeDate(2),
    paymentMethod: 'UPI',
    isFreeTrial: true,
    trialEndDate: getRelativeDate(2), // Trial ends in 2 days! Action needed
    status: 'trial',
    reminderDays: 2,
    usageFrequency: 'rarely', // Tagged as rarely used!
    brandColor: '#00C4CC',
    iconText: 'C',
    notes: 'Free 30-day trial for graphic templates. Rarely opened this month.'
  },
  {
    id: 'sub-chatgpt',
    providerId: 'openai-chatgpt',
    name: 'OpenAI ChatGPT',
    planName: 'ChatGPT Plus',
    category: 'AI & Dev',
    cost: 1999,
    costUSD: 20.00,
    billingCycle: 'monthly',
    firstBillingDate: '2023-08-15',
    nextRenewalDate: getRelativeDate(7), // Renews in 7 days
    paymentMethod: 'Credit Card',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'daily',
    brandColor: '#10A37F',
    iconText: '⚡',
    notes: 'Used daily for programming, research, and data analysis.'
  },
  {
    id: 'sub-spotify',
    providerId: 'spotify',
    name: 'Spotify',
    planName: 'Duo Premium',
    category: 'Music & Audio',
    cost: 149,
    costUSD: 14.99,
    billingCycle: 'monthly',
    firstBillingDate: '2022-11-20',
    nextRenewalDate: getRelativeDate(14),
    paymentMethod: 'UPI',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'daily',
    brandColor: '#1DB954',
    iconText: '♫',
    notes: 'Primary music platform shared with partner.'
  },
  {
    id: 'sub-apple-music',
    providerId: 'apple-one',
    name: 'Apple Music',
    planName: 'Individual',
    category: 'Music & Audio',
    cost: 99,
    costUSD: 10.99,
    billingCycle: 'monthly',
    firstBillingDate: '2023-09-10',
    nextRenewalDate: getRelativeDate(11),
    paymentMethod: 'Apple Pay',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'rarely', // Overlapping music service & rarely used!
    brandColor: '#FA243C',
    iconText: '',
    notes: 'Bought for Spatial audio trial. Rarely used since Spotify is active.'
  },
  {
    id: 'sub-google-one',
    providerId: 'google-one',
    name: 'Google One',
    planName: 'Standard (200 GB)',
    category: 'Utilities & Telecom',
    cost: 210,
    costUSD: 2.99,
    billingCycle: 'monthly',
    firstBillingDate: '2023-01-05',
    nextRenewalDate: getRelativeDate(18),
    paymentMethod: 'Debit Card',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'weekly',
    brandColor: '#4285F4',
    iconText: 'G',
    notes: 'Google Photos & Drive storage for 4 family members.'
  },
  {
    id: 'sub-github',
    providerId: 'github-copilot',
    name: 'GitHub Copilot',
    planName: 'Copilot Individual',
    category: 'AI & Dev',
    cost: 830,
    costUSD: 10.00,
    billingCycle: 'monthly',
    firstBillingDate: '2023-05-01',
    nextRenewalDate: getRelativeDate(22),
    paymentMethod: 'PayPal',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 3,
    usageFrequency: 'daily',
    brandColor: '#24292e',
    iconText: '⌥',
    notes: 'AI auto-completions in VS Code.'
  },
  {
    id: 'sub-cult',
    providerId: 'cult-fit',
    name: 'Cult.fit Gym & Fitness',
    planName: 'Cult Elite 12-Month',
    category: 'Fitness & Health',
    cost: 14500,
    costUSD: 189.99,
    billingCycle: 'yearly',
    firstBillingDate: '2024-02-01',
    nextRenewalDate: getRelativeDate(145),
    paymentMethod: 'Net Banking',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 7,
    usageFrequency: 'rarely', // Highlighted as rarely used gym membership!
    brandColor: '#FD3A69',
    iconText: 'cult',
    notes: 'Annual unlimited gym pass. Haven\'t attended classes in past 6 weeks.'
  },
  {
    id: 'sub-prime',
    providerId: 'amazon-prime',
    name: 'Amazon Prime',
    planName: 'Prime Annual',
    category: 'Entertainment',
    cost: 1499,
    costUSD: 139.00,
    billingCycle: 'yearly',
    firstBillingDate: '2023-10-12',
    nextRenewalDate: getRelativeDate(35),
    paymentMethod: 'Credit Card',
    isFreeTrial: false,
    trialEndDate: null,
    status: 'active',
    reminderDays: 5,
    usageFrequency: 'weekly',
    brandColor: '#00A8E1',
    iconText: 'P',
    notes: 'Free fast shipping, Prime Video 4K, and Prime Reading.'
  }
];
