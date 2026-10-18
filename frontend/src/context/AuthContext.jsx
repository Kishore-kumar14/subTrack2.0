import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

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
        const parsed = JSON.parse(saved);
        // Purge deprecated demo account if present
        if (parsed?.id === 'usr-alex-01' || parsed?.id?.startsWith('usr-demo-')) {
          localStorage.removeItem('subtrack_user');
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('subtrack_auth');
    const savedUser = localStorage.getItem('subtrack_user');
    if (!savedUser) return false;
    return savedAuth !== null ? savedAuth === 'true' : false;
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
    } else {
      localStorage.removeItem('subtrack_user');
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
        if (user.id) {
          api.updateUser(user.id, { currency: newCurrency }).catch(() => {});
        }
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

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res?.user) {
        if (res.token) localStorage.setItem('subtrack_token', res.token);
        setUser(res.user);
        if (res.user.currency) setCurrency(res.user.currency);
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
    } catch (e) {
      throw e;
    }
  };

  const loginWithGoogle = async (credentialOrProfile) => {
    try {
      let res;
      if (typeof credentialOrProfile === 'string') {
        res = await api.googleLogin(credentialOrProfile);
      } else {
        res = await api.googleLogin(null, credentialOrProfile);
      }

      if (res?.user) {
        if (res.token) localStorage.setItem('subtrack_token', res.token);
        setUser(res.user);
        if (res.user.currency) setCurrency(res.user.currency);
        setIsAuthenticated(true);
        return res;
      }
      throw new Error('Failed to retrieve user data from Google response');
    } catch (e) {
      console.warn('Google authentication backend notice:', e.message);

      // If credential was a JWT token, attempt local extraction
      if (typeof credentialOrProfile === 'string' && credentialOrProfile.includes('.')) {
        try {
          const base64Url = credentialOrProfile.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const fallbackUser = {
            id: `usr-g-${payload.sub || Date.now()}`,
            googleId: payload.sub,
            name: payload.name || payload.email?.split('@')[0] || 'Google User',
            email: payload.email || '',
            avatar: payload.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            currency: 'INR',
            monthlyBudget: 8000,
            joinedDate: new Date().toISOString().split('T')[0],
            preferences: {
              browserAlerts: true,
              emailAlerts: true,
              alertDaysBefore: 3,
              weeklyReport: true
            }
          };
          setUser(fallbackUser);
          setIsAuthenticated(true);
          return { user: fallbackUser, emailSent: false };
        } catch (err) {
          throw new Error(e.message || 'Failed to authenticate with Google');
        }
      } else if (typeof credentialOrProfile === 'object' && credentialOrProfile?.email) {
        // Direct profile fallback
        const fallbackUser = {
          id: `usr-g-${Date.now()}`,
          name: credentialOrProfile.name || credentialOrProfile.email.split('@')[0],
          email: credentialOrProfile.email,
          avatar: credentialOrProfile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          currency: 'INR',
          monthlyBudget: 8000,
          joinedDate: new Date().toISOString().split('T')[0],
          preferences: {
            browserAlerts: true,
            emailAlerts: true,
            alertDaysBefore: 3,
            weeklyReport: true
          }
        };
        setUser(fallbackUser);
        setIsAuthenticated(true);
        return { user: fallbackUser, emailSent: false };
      }
      throw e;
    }
  };

  const signup = async (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name || 'User',
      email: userData.email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      currency: userData.currency || 'INR',
      monthlyBudget: 8000,
      joinedDate: new Date().toISOString().split('T')[0],
      preferences: {
        browserAlerts: true,
        emailAlerts: true,
        alertDaysBefore: 3,
        weeklyReport: true
      }
    };

    const res = await api.register({ ...newUser, password: userData.password });
    if (res?.user) {
      if (res.token) localStorage.setItem('subtrack_token', res.token);
      setUser(res.user);
      setCurrency(res.user.currency || 'INR');
      setIsAuthenticated(true);
      return res;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('subtrack_user');
    localStorage.removeItem('subtrack_token');
    localStorage.removeItem('subtrack_auth');
  };

  const updateProfile = (updatedFields) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      if (updated?.id) {
        api.updateUser(updated.id, updatedFields).catch(err => {
          console.warn('Could not sync user profile to MongoDB backend:', err.message);
        });
      }
      return updated;
    });
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
        loginWithGoogle,
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
