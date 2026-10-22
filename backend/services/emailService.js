
import nodemailer from 'nodemailer';

// SubTrack Email Service
let transporter = null;
let transporterPromise = null;

function getTransporter() {
  if (transporter) return Promise.resolve(transporter);
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_SECURE,
      EMAIL_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
      throw new Error(
        'Missing SMTP_HOST, SMTP_USER, SMTP_PASS, or EMAIL_FROM'
      );
    }

    const port = Number(SMTP_PORT || 587);

    const mailer = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure:
        SMTP_SECURE !== undefined
          ? SMTP_SECURE.toLowerCase() === 'true'
          : port === 465,
      auth: {
        user: SMTP_USER.trim(),
        pass: SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    await mailer.verify();
    console.log('SubTrack SMTP connection verified');

    return mailer;
  })();

  try {
    transporter = await transporterPromise;
    return transporter;
  } catch (error) {
    transporterPromise = null;
    throw error;
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

// Send confirmation email after registration
export async function sendConfirmationEmail(user) {
  try {
    if (!user?.email) {
      throw new Error('User email is missing');
    }

    const mailer = await getTransporter();
    const appUrl = (
      process.env.APP_URL || 'http://localhost:5173'
    ).replace(/\/+$/, '');

    const name = escapeHtml(user.name || 'there');
    const email = escapeHtml(user.email);
    const accountId = escapeHtml(user.id || 'N/A');
    const currency = escapeHtml(user.currency || 'INR');
    const date = new Date().toLocaleDateString('en-IN');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="margin:0;padding:24px;background:#0f172a;color:#f8fafc;font-family:Arial,sans-serif">
        <div style="max-width:600px;margin:auto;background:#1e293b;padding:30px;border-radius:16px">
          <h1 style="color:#60a5fa">Welcome to SubTrack!</h1>
          <h2>Hello, ${name}!</h2>
          <p>Thank you for creating your SubTrack account.</p>
          <p>Your account is ready. Start tracking subscriptions,
          managing renewal dates, and monitoring recurring expenses.</p>
          <hr style="border-color:#334155">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Account ID:</strong> ${accountId}</p>
          <p><strong>Currency:</strong> ${currency}</p>
          <p><strong>Registration date:</strong> ${date}</p>
          <p style="margin-top:28px">
            <a href="${escapeHtml(appUrl)}"
              style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px">
              Open Your Dashboard
            </a>
          </p>
          <p style="font-size:12px;color:#94a3b8">
            If you did not create this account, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to SubTrack, ${user.name || 'there'}!

Your account registration is confirmed.
Email: ${user.email}
Account ID: ${user.id || 'N/A'}
Currency: ${user.currency || 'INR'}
Registration date: ${date}

Open your dashboard: ${appUrl}
    `;

    const info = await mailer.sendMail({
      from: {
        name: 'SubTrack',
        address: process.env.EMAIL_FROM,
      },
      to: user.email,
      subject: 'Welcome to SubTrack - Your Account Is Confirmed!',
      text,
      html,
    });

    console.log('SubTrack email result:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    if (
      info.rejected?.length ||
      !info.accepted?.some(
        (address) =>
          address.toLowerCase() === user.email.toLowerCase()
      )
    ) {
      throw new Error('SMTP server did not accept the recipient');
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('SubTrack email failed:', {
      recipient: user?.email,
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

// Diagnostic function for testing SMTP configuration
export async function testEmailConnection() {
  try {
    const mailer = await getTransporter();
    await mailer.verify();

    console.log('SMTP test successful');
    return { success: true };
  } catch (error) {
    console.error('SMTP test failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
    });

    return { success: false, error: error.message };
  }
}

// Send a real test email to an address you control
export async function sendTestEmail(recipient) {
  try {
    if (!recipient || !recipient.includes('@')) {
      throw new Error('A valid recipient email is required');
    }

    const mailer = await getTransporter();

    const info = await mailer.sendMail({
      from: {
        name: 'SubTrack',
        address: process.env.EMAIL_FROM,
      },
      to: recipient,
      subject: 'SubTrack SMTP Test',
      text: 'Your SubTrack SMTP configuration is working.',
      html: '<h2>SubTrack SMTP Test</h2><p>Your SMTP configuration is working.</p>',
    });

    console.log('Test email submitted:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('Test email failed:', error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}
