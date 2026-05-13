import nodemailer from 'nodemailer';
import dns from 'dns';

// ── CRITICAL FIX: Force Node.js to use IPv4 first ──
// This prevents the 'ENETUNREACH' error when trying to connect via IPv6 on Render/cloud hosts.
dns.setDefaultResultOrder('ipv4first');

let transporter = null;

const resolveConfig = () => ({
    host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
    port: Number(process.env.EMAIL_PORT || 587),
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASS || '').trim(),
    from: (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'CodeArena 1v1 <noreply@gmail.com>').trim(),
});

const getTransporter = () => {
    if (!transporter) {
        const config = resolveConfig();
        
        console.log(`[MAIL] Initializing transporter: ${config.host}:${config.port}`);
        
        transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465, // true for 465, false for other ports
            auth: {
                user: config.user,
                pass: config.pass,
            },
            // ── Robust Connection Settings ──
            connectionTimeout: 15000, // 15 seconds
            greetingTimeout: 15000,
            socketTimeout: 20000,
            tls: {
                // Do not fail on invalid certs (common in some environments)
                rejectUnauthorized: false,
                // Force IPv4 if the OS supports it
                servername: config.host
            }
        });
    }
    return transporter;
};

const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '***';
    const [name, domain] = email.split('@');
    return `${name.substring(0, 2)}***@${domain}`;
};

/**
 * Primary mail sending function
 */
export const sendMail = async ({ to, subject, html, label = 'Email' }) => {
    const config = resolveConfig();
    const mailTransporter = getTransporter();

    console.log(`[MAIL] Sending ${label} to ${maskEmail(to)}...`);

    try {
        const info = await mailTransporter.sendMail({
            from: config.from,
            to,
            subject,
            html,
        });

        console.log(`[MAIL] ✅ ${label} sent successfully: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[MAIL] ❌ ${label} delivery failed:`, {
            code: error.code,
            message: error.message,
            command: error.command
        });

        // Reset transporter on connection errors to force a fresh connection next time
        if (['ETIMEDOUT', 'ECONNRESET', 'ESOCKET', 'ENETUNREACH'].includes(error.code)) {
            transporter = null;
        }

        throw Object.assign(new Error(`Failed to send ${label}`), {
            code: error.code || 'SMTP_ERROR',
            status: 502,
            cause: error
        });
    }
};

/**
 * Startup verification check
 * CRITICAL: This is now modified to NEVER throw an error that crashes the server.
 */
export const verifySmtpConnection = async () => {
    const config = resolveConfig();
    
    if (!config.user || !config.pass) {
        console.warn('[MAIL] ⚠️ Email credentials missing in environment. Mail features will fail.');
        return false;
    }

    try {
        const mailTransporter = getTransporter();
        console.log('[MAIL] Verifying SMTP connection...');
        
        // We use a promise wrapper with a timeout to prevent startup hanging
        const verification = await Promise.race([
            mailTransporter.verify(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timed out')), 10000))
        ]);

        console.log('[MAIL] ✅ SMTP connection verified.');
        return true;
    } catch (error) {
        // ── DO NOT THROW HERE ──
        // We log the error but return false instead of crashing the server.
        console.error('[MAIL] ⚠️ SMTP connection check failed during startup:', {
            message: error.message,
            code: error.code
        });
        console.warn('[MAIL] Server will continue to start, but email delivery might fail.');
        return false;
    }
};

// ── Email Templates ────────────────────────────────────────

const brandedHtml = ({ heading, subtitle, bodyHtml }) => `
<div style="font-family:Arial,sans-serif;line-height:1.6;color:#e5e7eb;background:#0f1117;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#121212;border:1px solid #1f2937;border-radius:20px;overflow:hidden">
    <div style="padding:28px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#0f172a,#121212)">
      <p style="margin:0 0 8px;color:#4ade80;font-size:12px;letter-spacing:.18em;font-weight:700;text-transform:uppercase">${subtitle}</p>
      <h1 style="margin:0;font-size:24px;color:#f9fafb">${heading}</h1>
    </div>
    <div style="padding:28px">${bodyHtml}</div>
  </div>
</div>`;

const otpBlock = (otp, expiresInMinutes) => `
<div style="margin:24px 0;padding:18px;border-radius:16px;border:1px solid #1f2937;background:#0b0d12;text-align:center">
  <p style="margin:0 0 10px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.16em">Verification Code</p>
  <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#4ade80">${otp}</p>
</div>
<p style="color:#d1d5db">This code expires in ${expiresInMinutes} minutes.</p>`;

// ── Specific Email Methods ─────────────────────────────────

export const sendAccountVerificationEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'Verify your CodeArena 1v1 account',
        label: 'Account Verification',
        html: brandedHtml({
            heading: 'Welcome to the Arena!',
            subtitle: 'CodeArena 1v1 Verification',
            bodyHtml: `<p>Hi ${name || 'there'},</p><p>Verify your email using the code below:</p>${otpBlock(otp, expiresInMinutes)}`
        }),
    });

export const sendSettingsOtpEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'Security verification code',
        label: 'Settings OTP',
        html: brandedHtml({
            heading: 'Verify your update',
            subtitle: 'CodeArena 1v1 Security',
            bodyHtml: `<p>Hi ${name || 'there'},</p><p>Use the code below to verify your changes:</p>${otpBlock(otp, expiresInMinutes)}`
        }),
    });

export const sendPasswordResetOtpEmail = ({ to, otp, name, expiresInMinutes }) =>
    sendMail({
        to,
        subject: 'Password reset code',
        label: 'Password Reset',
        html: brandedHtml({
            heading: 'Reset your password',
            subtitle: 'CodeArena 1v1 Recovery',
            bodyHtml: `<p>Hi ${name || 'there'},</p><p>Use this code to reset your password:</p>${otpBlock(otp, expiresInMinutes)}`
        }),
    });

export const sendPaymentSubmissionEmail = ({ to, name, planName, amount, utrNumber }) =>
    sendMail({
        to,
        subject: `Payment received for ${planName}`,
        label: 'Payment Submission',
        html: `<p>Hi ${name},</p><p>We received your request for ${planName} (Rs. ${amount}). UTR: ${utrNumber}</p>`
    });

export const sendPaymentApprovedEmail = ({ to, name, planName, amount }) =>
    sendMail({
        to,
        subject: `Welcome to CodeArena 1v1 ${planName}`,
        label: 'Payment Approved',
        html: `<p>Hi ${name},</p><p>Your ${planName} payment of Rs. ${amount} was approved!</p>`
    });

export const sendPaymentRejectedEmail = ({ to, name, planName, amount, adminNotes }) =>
    sendMail({
        to,
        subject: 'Payment could not be verified',
        label: 'Payment Rejected',
        html: `<p>Hi ${name},</p><p>We couldn't verify your ${planName} payment. Note: ${adminNotes || 'Please check your UTR.'}</p>`
    });

// ── Legacy Diagnostics Export ──
export const getSmtpDiagnostics = () => {
    const config = resolveConfig();
    return {
        host: config.host,
        port: config.port,
        user: maskEmail(config.user),
        configured: Boolean(config.user && config.pass)
    };
};
