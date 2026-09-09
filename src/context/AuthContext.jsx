import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USER } from '../data/seedData';

const AuthContext = createContext();

export const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rateFromINR: 1, name: 'Indian Rupee' },
  USD: { symbol: '$', rateFromINR: 0.012, name: 'US Dollar' }
};

export function AuthProvider({ children }) {
  // Persistent user state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('subtrack_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return INITIAL_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('subtrack_auth') === 'true';
  });


  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('subtrack_currency') || user?.currency || 'INR';
    return CURRENCY_CONFIG[saved] ? saved : 'INR';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('subtrack_theme') || 'dark';
  });

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    localStorage.setItem('subtrack_theme', theme);
  }, [theme]);

  // Sync user state
  useEffect(() => {
    if (user) {
      localStorage.setItem('subtrack_user', JSON.stringify(user));
    }
  }, [user]);

  // Sync currency
  useEffect(() => {
    localStorage.setItem('subtrack_currency', currency);
  }, [currency]);

  // Sync auth
  useEffect(() => {
    localStorage.setItem('subtrack_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeCurrency = (newCurrency) => {
    if (CURRENCY_CONFIG[newCurrency]) {
      setCurrency(newCurrency);
      if (user) {
        setUser(prev => ({ ...prev, currency: newCurrency }));
      }
    }
  };

  // Convert and format currency based on active selection (INR default, USD supported)
  const formatAmount = (costInINR) => {
    if (costInINR === null || costInINR === undefined) return '—';
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
    const converted = costInINR * config.rateFromINR;

    if (currency === 'INR') {
      return `${config.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
    } else {
      return `${config.symbol}${converted.toFixed(2)}`;
    }
  };

  const login = (email, password) => {
    const existing = user || INITIAL_USER;
    setUser({
      ...existing,
      email: email || existing.email
    });
    setIsAuthenticated(true);
    return true;
  };

  const demoLogin = () => {
    setUser(INITIAL_USER);
    setCurrency(INITIAL_USER.currency);
    setIsAuthenticated(true);
    return true;
  };

  const signup = (userData) => {
    const newUser = {
      ...INITIAL_USER,
      id: `usr-${Date.now()}`,
      name: userData.name || 'User',
      email: userData.email,
      currency: userData.currency || 'INR',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setUser(newUser);
    setCurrency(newUser.currency);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        currency,
        currencySymbol: CURRENCY_CONFIG[currency]?.symbol || '₹',
        changeCurrency,
        formatAmount,
        theme,
        toggleTheme,
        login,
        demoLogin,
        signup,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
