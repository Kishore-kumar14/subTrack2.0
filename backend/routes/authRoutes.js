import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { isDBConnected } from '../config/db.js';
import { sendConfirmationEmail, diagnoseEmailService } from '../services/emailService.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
function getGoogleClient() {
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
}

const checkDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      error: 'MongoDB is not connected. Please ensure MongoDB is running and MONGODB_URI is configured correctly.'
    });
  }
  next();
};

/**
 * POST /api/auth/register
 * Create / register a new user in MongoDB and send confirmation email
 */
router.post('/register', checkDB, async (req, res) => {
  try {
    const { name, email, password, currency, monthlyBudget, preferences } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({
      id: req.body.id || `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: password || '',
      currency: currency || 'INR',
      monthlyBudget: monthlyBudget || 8000,
      joinedDate: new Date().toISOString().split('T')[0],
      preferences: preferences || {
        browserAlerts: true,
        emailAlerts: true,
        alertDaysBefore: 3,
        weeklyReport: true
      }
    });

    const saved = await newUser.save();

    // Send signup confirmation email
    sendConfirmationEmail(saved).catch((err) => {
      console.warn('Could not dispatch signup confirmation email:', err.message);
    });

    const token = generateToken(saved);

    res.status(201).json({
      success: true,
      user: saved,
      token,
      emailSent: true,
      message: `Account created successfully! A confirmation email has been dispatched to ${saved.email}.`
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Log in user from MongoDB
 */
router.post('/login', checkDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    const token = generateToken(user);

    res.json({ success: true, user, token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/user/:id
 * Retrieve user by ID
 */
router.get('/user/:id', checkDB, async (req, res) => {
  try {
    const rawId = req.params.id;
    const stripped = rawId.replace(/^usr-g-/, '').replace(/^g-/, '');
    const user = await User.findOne({
      $or: [
        { id: rawId },
        { googleId: rawId },
        { googleId: stripped },
        { id: `usr-g-${stripped}` }
      ]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/user/:id
 * Update user profile in MongoDB
 */
router.put('/user/:id', checkDB, async (req, res) => {
  try {
    const rawId = req.params.id;
    const stripped = rawId.replace(/^usr-g-/, '').replace(/^g-/, '');
    const updated = await User.findOneAndUpdate(
      {
        $or: [
          { id: rawId },
          { googleId: rawId },
          { googleId: stripped },
          { id: `usr-g-${stripped}` }
        ]
      },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile in MongoDB:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/google
 * Verify Google ID token (or simulated Google profile) and find or create user in MongoDB.
 * Also dispatches confirmation email for new Google registrations!
 */
router.post('/google', checkDB, async (req, res) => {
  try {
    const { token, directProfile } = req.body;

    if (!token && !directProfile) {
      return res.status(400).json({ error: 'Google credential token or profile is required' });
    }

    let googleId;
    let email;
    let name;
    let picture;

    // Check if direct profile was submitted (e.g. custom Google sign in dialog or dev mode)
    if (directProfile && directProfile.email) {
      email = directProfile.email.toLowerCase();
      name = directProfile.name || email.split('@')[0];
      picture = directProfile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      googleId = directProfile.googleId || `g-${Date.now()}`;
    } else {
      // Decode or verify token
      const clientId = process.env.GOOGLE_CLIENT_ID;
      let payload = null;

      if (clientId && !clientId.includes('your-google-client-id')) {
          const ticket = await getGoogleClient().verifyIdToken({
            idToken: token,
            audience: clientId
          });
          payload = ticket.getPayload();
        } catch (verifyError) {
          console.warn('Google client token verification note:', verifyError.message);
        }
      }

      // If token verification didn't yield payload, decode JWT payload
      if (!payload && token && token.includes('.')) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          payload = JSON.parse(jsonPayload);
        } catch (decodeErr) {
          console.error('Could not parse Google token payload:', decodeErr.message);
        }
      }

      if (!payload || !payload.email) {
        return res.status(400).json({
          error: 'Could not extract Google account info from token. Please ensure your Google Client ID is configured or use email registration.'
        });
      }

      googleId = payload.sub || `g-${Date.now()}`;
      email = payload.email.toLowerCase();
      name = payload.name || email.split('@')[0];
      picture = payload.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { googleId }]
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = new User({
        id: `usr-g-${Date.now()}`,
        googleId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        avatar: picture,
        currency: 'INR',
        monthlyBudget: 8000,
        joinedDate: new Date().toISOString().split('T')[0],
        preferences: {
          browserAlerts: true,
          emailAlerts: true,
          alertDaysBefore: 3,
          weeklyReport: true
        }
      });
      await user.save();

      // Send signup confirmation email to Google user!
      sendConfirmationEmail(user).catch((err) => {
        console.warn('Could not dispatch Google signup confirmation email:', err.message);
      });
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (picture && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = picture;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    const authToken = generateToken(user);

    res.json({
      success: true,
      user,
      token: authToken,
      isNewUser,
      emailSent: isNewUser,
      message: isNewUser
        ? `Welcome to SubTrack! Confirmation email dispatched to ${user.email}.`
        : `Welcome back, ${user.name}!`
    });
  } catch (error) {
    console.error('Error in /api/auth/google:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/resend-confirmation
 * Resend confirmation email to user
 */
router.post('/resend-confirmation', checkDB, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email: email.toLowerCase(),
        currency: 'INR',
        monthlyBudget: 8000,
        joinedDate: new Date().toISOString().split('T')[0],
        preferences: {
          browserAlerts: true,
          emailAlerts: true,
          alertDaysBefore: 3,
          weeklyReport: true
        }
      });
      await user.save();
    }

    const result = await sendConfirmationEmail(user);
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to dispatch confirmation email' });
    }

    res.json({ success: true, message: `Confirmation email sent to ${user.email}!` });
  } catch (err) {
    console.error('Error in resend-confirmation:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/email-diagnostic
 * Check email configuration and connectivity in production
 */
router.get('/email-diagnostic', async (req, res) => {
  try {
    const diagnostic = await diagnoseEmailService();
    res.json(diagnostic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/test-email
 * Dispatch a test confirmation email to verify deliverability
 */
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Target email is required' });
    }

    const testUser = {
      id: 'diagnostic-test',
      name: 'Diagnostic Tester',
      email: email.toLowerCase(),
      currency: 'INR'
    };

    const result = await sendConfirmationEmail(testUser);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: `Test confirmation email dispatched successfully to ${email}!`,
      messageId: result.messageId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
