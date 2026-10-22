import nodemailer from 'nodemailer';

/**
 * SubTrack Email Service
 * Handles user confirmation emails, alerts, and notifications.
 */

import dotenv from 'dotenv';
dotenv.config();

// Cache transporter instance
let transporter = null;

/**
 * Initialize or get the email transporter.
 * Supports custom SMTP, Gmail, or Ethereal test account fallback.
 */
async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_USER && SMTP_PASS) {
    const isGmail = SMTP_HOST === 'smtp.gmail.com' || (!SMTP_HOST && SMTP_USER.endsWith('@gmail.com')) || process.env.SMTP_SERVICE?.toLowerCase() === 'gmail';

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_USER.trim(),
          pass: SMTP_PASS ? SMTP_PASS.replace(/\s+/g, '') : ''
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000
      });
      console.log(`📧 SubTrack Email Service initialized with Gmail (${SMTP_USER})`);
      return transporter;
    }

    if (SMTP_HOST) {
      const port = Number(SMTP_PORT) || 465;
      const secure = SMTP_SECURE === 'true' || port === 465;

      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: {
          user: SMTP_USER.trim(),
          pass: SMTP_PASS ? SMTP_PASS.replace(/\s+/g, '') : ''
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000
      });
      console.log(`📧 SubTrack Email Service initialized with SMTP (${SMTP_HOST}:${port}, secure=${secure})`);
      return transporter;
    }
  }

  // Fallback: Create ethereal test account for local testing/development
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      connectionTimeout: 8000
    });
    console.log(`📧 SubTrack Email Service: Using Ethereal test inbox (${testAccount.user})`);
    return transporter;
  } catch (err) {
    console.warn('⚠️ Could not initialize Ethereal mailer, using console mail logger:', err.message);
    transporter = {
      sendMail: async (opts) => {
        console.log(`\n================== [SIMULATED EMAIL DISPATCH] ==================`);
        console.log(`To:      ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(`----------------------------------------------------------------`);
        console.log(`Text preview: ${opts.text?.slice(0, 200)}...`);
        console.log(`================================================================\n`);
        return { messageId: `sim-${Date.now()}` };
      }
    };
    return transporter;
  }
}

/**
 * Diagnostic utility to check email service status in production
 */
export async function diagnoseEmailService() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL } = process.env;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    frontendUrl: FRONTEND_URL || 'http://localhost:5173 (Default localhost, set FRONTEND_URL in production)',
    provider: null,
    ready: false,
    details: {}
  };

  // 1. Check Resend (HTTP API over port 443 - Immune to cloud SMTP port blocks like Render)
  if (RESEND_API_KEY) {
    diagnostics.provider = 'Resend (HTTP API)';
    diagnostics.details = {
      apiKeyConfigured: true,
      fromAddress: EMAIL_FROM || 'SubTrack <onboarding@resend.dev>',
      note: 'Uses HTTPS port 443, immune to cloud host SMTP port blocks.'
    };
    diagnostics.ready = true;
    return diagnostics;
  }

  // 2. Check SMTP (Gmail / Custom)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const isGmail = SMTP_HOST === 'smtp.gmail.com' || process.env.SMTP_SERVICE?.toLowerCase() === 'gmail';
    const port = Number(SMTP_PORT) || (isGmail ? 465 : 587);
    const secure = SMTP_SECURE === 'true' || port === 465;

    diagnostics.provider = isGmail ? 'Gmail SMTP' : `Custom SMTP (${SMTP_HOST})`;
    diagnostics.details = {
      host: SMTP_HOST,
      port,
      secure,
      user: `${SMTP_USER.slice(0, 3)}***@${SMTP_USER.split('@')[1] || ''}`,
      passConfigured: true,
      fromAddress: EMAIL_FROM || `SubTrack App <${SMTP_USER}>`
    };

    try {
      const mailer = await getTransporter();
      if (mailer.verify) {
        await mailer.verify();
        diagnostics.ready = true;
        diagnostics.details.status = 'SMTP connection and credentials verified successfully!';
      } else {
        diagnostics.ready = true;
      }
    } catch (err) {
      diagnostics.ready = false;
      diagnostics.details.error = err.message;
      if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout') || err.code === 'ECONNREFUSED') {
        diagnostics.details.hint = 'Connection timed out. On cloud hosts like Render free tier, outbound SMTP ports (25, 465, 587) are blocked by default. Fix: Set RESEND_API_KEY in your cloud environment variables or request Render to unblock SMTP.';
      } else if (err.code === 'EAUTH' || err.responseCode === 535) {
        diagnostics.details.hint = 'Authentication failed. If using Gmail, you must use a 16-character App Password (not your normal Google account password) and ensure 2-Step Verification is active on your Google account.';
      }
    }
    return diagnostics;
  }

  // 3. Fallback: Unconfigured
  diagnostics.provider = 'Unconfigured (Fallback)';
  diagnostics.ready = false;
  diagnostics.details = {
    warning: 'No email environment variables found on server.',
    hint: 'Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (or RESEND_API_KEY) in your cloud deployment environment settings (e.g. Render Dashboard -> Environment).'
  };
  return diagnostics;
}

/**
 * Send account confirmation email upon registration or Google signup
 */
export async function sendConfirmationEmail(user) {
  try {
    let fromAddress = process.env.EMAIL_FROM;
    if (!fromAddress || !fromAddress.includes('@')) {
      const fallbackSender = process.env.SMTP_USER || 'no-reply@subtrack.app';
      fromAddress = `"SubTrack App" <${fallbackSender}>`;
    }
    const userName = user.name || 'there';
    const userEmail = user.email;
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to SubTrack</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: #bfdbfe; font-size: 14px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #cbd5e1; font-size: 15px; }
    .welcome-badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .feature-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .feature-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
    .feature-item:last-child { margin-bottom: 0; }
    .feature-icon { margin-right: 12px; font-size: 18px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-top: 16px; text-align: center; }
    .footer { padding: 20px 28px; background: #0b1120; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>SubTrack</h1>
      <p>Intelligent Subscription & Expense Management</p>
    </div>
    <div class="content">
      <div class="welcome-badge">✓ Account Successfully Confirmed</div>
      <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 20px;">Welcome, ${userName}!</h2>
      <p>Thank you for creating an account with SubTrack. Your registration is confirmed and your personal workspace is ready.</p>
      
      <div class="feature-box">
        <div style="font-weight: 700; color: #f8fafc; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">What you can do next:</div>
        
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div><strong>Track All Recurring Plans:</strong> Add your subscriptions, recharge plans, and streaming services to monitor monthly cash outflows.</div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">📅</div>
          <div><strong>Sync with Google Calendar:</strong> Connect renewal dates directly to your Google Calendar to get mobile push reminders before you are billed.</div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">⏳</div>
          <div><strong>Trial Expiry Protection:</strong> Never get charged accidentally again with customizable advance alerts for free trials.</div>
        </div>
      </div>

      <p style="margin-bottom: 8px;"><strong>Account Details:</strong></p>
      <ul style="margin-top: 4px; padding-left: 20px; color: #94a3b8; font-size: 14px;">
        <li>Email: <span style="color: #f1f5f9;">${userEmail}</span></li>
        <li>Account ID: <span style="color: #f1f5f9;">${user.id}</span></li>
        <li>Preferred Currency: <span style="color: #f1f5f9;">${user.currency || 'INR'}</span></li>
        <li>Registration Date: <span style="color: #f1f5f9;">${new Date().toLocaleDateString()}</span></li>
      </ul>

      <center>
        <a href="${frontendUrl}" class="btn">Open Your Dashboard →</a>
      </center>
    </div>
    <div class="footer">
      SubTrack • Private & Secure Recurring Expense Tracking<br />
      If you did not sign up for this account, please ignore this email.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Welcome to SubTrack, ${userName}!

Your account registration is confirmed.
Email: ${userEmail}
Currency: ${user.currency || 'INR'}
Registration Date: ${new Date().toLocaleDateString()}

You can now track all your subscriptions, sync renewal dates to your Google Calendar for mobile push notifications, and monitor your monthly expenses.

Log in here: ${frontendUrl}

SubTrack App
    `;

    // 1. If RESEND_API_KEY is configured (HTTP API over HTTPS port 443 - Bypasses Render/cloud SMTP blocks)
    if (process.env.RESEND_API_KEY) {
      const resendFrom = process.env.EMAIL_FROM || 'SubTrack <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [userEmail],
          subject: `Welcome to SubTrack - Your Account is Confirmed! 🚀`,
          html: htmlContent,
          text: textContent
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error?.message || `Resend dispatch failed with status ${res.status}`);
      }
      console.log(`✉️ Confirmation email sent via Resend API to ${userEmail} (ID: ${resData.id})`);
      return { success: true, messageId: resData.id };
    }

    // 2. Standard SMTP Dispatch (Nodemailer)
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: fromAddress,
      to: userEmail,
      subject: `Welcome to SubTrack - Your Account is Confirmed! 🚀`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✉️ Confirmation email successfully sent to ${userEmail} (ID: ${info.messageId})`);
    
    // If ethereal, log preview URL
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send confirmation email to ${user?.email}:`, error.message);
    const isPortBlocked = error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.code === 'ECONNREFUSED';
    const friendlyError = isPortBlocked
      ? "Render blocks outbound SMTP ports (465/587). Please add RESEND_API_KEY in Render Dashboard -> Environment to enable live email delivery over HTTPS."
      : error.message;
    return { success: false, error: friendlyError, isPortBlocked };
  }
}
