import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR'
    },
    monthlyBudget: {
      type: Number,
      default: 8000
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    joinedDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    preferences: {
      browserAlerts: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      alertDaysBefore: { type: Number, default: 3 },
      weeklyReport: { type: Boolean, default: true }
    },
    googleCalendar: {
      connected: { type: Boolean, default: false },
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      expiryDate: { type: Number, default: null },
      calendarId: { type: String, default: 'primary' },
      lastSyncedAt: { type: Date, default: null },
      syncStatus: {
        type: String,
        enum: ['connected', 'syncing', 'synced', 'error', 'disconnected'],
        default: 'disconnected'
      },
      lastError: { type: String, default: null }
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

export default User;
